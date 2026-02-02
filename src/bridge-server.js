#!/usr/bin/env node

/**
 * Kiro ↔ OpenClaw 桥接服务
 * 
 * 工作流程：
 * 1. 你在浏览器发消息
 * 2. 消息通过 WebSocket 发到这个服务器
 * 3. 服务器调用 OpenClaw CLI
 * 4. OpenClaw 的回复实时流式广播到浏览器
 * 5. 同时，Kiro（我）可以通过 HTTP API 发送消息到浏览器
 */

const WebSocket = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 存储所有连接的客户端
const clients = new Set();

// 消息目录
const MESSAGE_DIR = path.join(__dirname, '.kiro-chat-messages');

// 确保消息目录存在
if (!fs.existsSync(MESSAGE_DIR)) {
  fs.mkdirSync(MESSAGE_DIR, { recursive: true });
}

// 通知 Kiro 有新消息
function notifyKiro(sender, senderName, message) {
  // 只通知用户和 OpenClaw 的消息，不通知 Kiro 自己的消息
  if (sender === 'kiro' || sender === 'system') {
    return;
  }
  
  const timestamp = Date.now();
  const filename = `msg-${timestamp}.json`;
  const filepath = path.join(MESSAGE_DIR, filename);
  
  const messageData = {
    timestamp,
    sender,
    senderName,
    message
  };
  
  fs.writeFileSync(filepath, JSON.stringify(messageData, null, 2));
  console.log(`📬 通知 Kiro: ${filename}`);
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 主页面
  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHTML());
  }
  // Kiro 发送消息的 API
  else if (parsedUrl.pathname === '/api/kiro/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const kiroMessage = data.message;
        
        // 广播 Kiro 的消息
        broadcast({
          type: 'message',
          sender: 'kiro',
          name: 'Kiro',
          text: kiroMessage
        });
        
        // 通知 OpenClaw（让 OpenClaw 也能看到 Kiro 的回复）
        callOpenClawStreaming(kiroMessage);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
  // 获取状态
  else if (parsedUrl.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      clients: clients.size,
      kiro: true,
      openclaw: true
    }));
  }
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket 服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('✓ 新客户端连接');
  clients.add(ws);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'message',
    sender: 'system',
    name: '系统',
    text: '欢迎！你现在可以和 Kiro 和 OpenClaw 对话了。'
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到 WebSocket 消息:', data);
      
      if (data.type === 'message') {
        const userMessage = data.text;
        const notifyKiro = data.notifyKiro !== false; // 默认为 true
        console.log('用户消息内容:', userMessage, '| 通知 Kiro:', notifyKiro);
        
        // 广播用户消息
        broadcast({
          type: 'message',
          sender: 'user',
          name: '你',
          text: userMessage
        });
        
        // 根据开关决定是否通知 Kiro
        if (notifyKiro) {
          notifyKiro('user', '你', userMessage);
        } else {
          console.log('⏸️  通知 Kiro 已关闭，跳过通知');
        }
        
        // 调用 OpenClaw（实时流式）
        callOpenClawStreaming(userMessage);
      }
    } catch (e) {
      console.error('消息处理错误:', e);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('✗ 客户端断开');
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 实时调用 OpenClaw
function callOpenClawStreaming(message) {
  broadcast({
    type: 'typing',
    text: 'OpenClaw 正在思考...'
  });
  
  // 自动检测 OpenClaw 路径
  const openclawPath = process.env.OPENCLAW_PATH || 
    path.join(process.env.HOME, '.openclaw', 'openclaw.mjs') ||
    path.join(__dirname, '..', '..', 'openclaw', 'openclaw.mjs');
  
  // 检查 OpenClaw 是否存在
  if (!fs.existsSync(openclawPath)) {
    broadcast({
      type: 'message',
      sender: 'system',
      name: '系统',
      text: '⚠️ 未找到 OpenClaw。请设置环境变量 OPENCLAW_PATH 或安装 OpenClaw。'
    });
    return;
  }
  
  // 使用 node 命令（自动使用系统 PATH）
  const openclaw = spawn('node', [
    openclawPath,
    'agent',
    '--to', 'main',
    '--message', message,
    '--thinking', 'low'
  ], {
    cwd: path.dirname(openclawPath)
  });
  
  broadcast({
    type: 'stream_start',
    sender: 'openclaw',
    name: 'OpenClaw'
  });
  
  let buffer = '';
  let hasOutput = false;
  
  openclaw.stdout.on('data', (data) => {
    const text = data.toString();
    buffer += text;
    hasOutput = true;
    
    broadcast({
      type: 'stream_chunk',
      text: text
    });
  });
  
  openclaw.stderr.on('data', (data) => {
    console.error('OpenClaw stderr:', data.toString());
  });
  
  openclaw.on('close', (code) => {
    broadcast({
      type: 'stream_end'
    });
    
    if (code === 0 && hasOutput && buffer.trim()) {
      // OpenClaw 回复完成，通知 Kiro
      notifyKiro('openclaw', 'OpenClaw', buffer.trim());
    } else if (code !== 0 || !hasOutput) {
      broadcast({
        type: 'message',
        sender: 'system',
        name: '系统',
        text: `⚠️ OpenClaw 执行出错（退出码: ${code}）`
      });
    }
  });
  
  openclaw.on('error', (err) => {
    console.error('OpenClaw 错误:', err);
    broadcast({
      type: 'message',
      sender: 'system',
      name: '系统',
      text: '⚠️ OpenClaw 连接失败: ' + err.message
    });
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Kiro ↔ OpenClaw 三方对话</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            width: 90%;
            max-width: 1200px;
            height: 90vh;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 20px 20px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .header h1 { 
            font-size: 20px; 
            margin: 0;
        }
        .status {
            display: flex;
            gap: 15px;
            font-size: 13px;
        }
        .status-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f9fafb;
        }
        .message {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message.user { justify-content: flex-end; }
        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }
        .message.user .message-avatar { background: #3b82f6; }
        .message.kiro .message-avatar { background: #8b5cf6; }
        .message.openclaw .message-avatar { background: #ec4899; }
        .message.system .message-avatar { background: #6b7280; }
        .message-content { max-width: 60%; }
        .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
        }
        .message-name { font-weight: 600; font-size: 14px; }
        .message-time { font-size: 12px; color: #6b7280; }
        .message-text {
            background: white;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            word-wrap: break-word;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .message.user .message-text {
            background: #3b82f6;
            color: white;
        }
        .message.streaming .message-text {
            border-left: 3px solid #ec4899;
        }
        .typing {
            display: none;
            padding: 10px 20px;
            color: #6b7280;
            font-style: italic;
            font-size: 14px;
        }
        .typing.show { display: block; }
        .input-area {
            padding: 15px 20px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 10px;
            align-items: center;
            border-radius: 0 0 20px 20px;
        }
        .notify-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #6b7280;
            white-space: nowrap;
        }
        .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background: #4ade80;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .toggle-switch.off {
            background: #d1d5db;
        }
        .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .toggle-switch.off .toggle-slider {
            transform: translateX(0);
        }
        .toggle-switch:not(.off) .toggle-slider {
            transform: translateX(20px);
        }
        #messageInput {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 14px;
            outline: none;
        }
        #messageInput:focus { border-color: #667eea; }
        #sendBtn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        #sendBtn:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <h1>🦞 Kiro ↔ OpenClaw 三方对话</h1>
                <div class="status">
                    <div class="status-item">
                        <div class="status-dot"></div>
                        <span>你</span>
                    </div>
                    <div class="status-item">
                        <div class="status-dot"></div>
                        <span>Kiro（IDE）</span>
                    </div>
                    <div class="status-item">
                        <div class="status-dot"></div>
                        <span>OpenClaw</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="messages" id="messages"></div>
        <div class="typing" id="typing"></div>
        
        <div class="input-area">
            <div class="notify-toggle">
                <span>通知 Kiro</span>
                <div class="toggle-switch" id="notifyToggle">
                    <div class="toggle-slider"></div>
                </div>
            </div>
            <input type="text" id="messageInput" placeholder="输入消息..." autofocus>
            <button id="sendBtn">发送</button>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:8767');
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typing = document.getElementById('typing');
        const notifyToggle = document.getElementById('notifyToggle');
        
        let currentStreamingMessage = null;
        let notifyKiroEnabled = true; // 默认开启通知
        
        // 切换通知开关
        notifyToggle.addEventListener('click', () => {
            notifyKiroEnabled = !notifyKiroEnabled;
            if (notifyKiroEnabled) {
                notifyToggle.classList.remove('off');
            } else {
                notifyToggle.classList.add('off');
            }
        });
        
        ws.onopen = () => console.log('已连接');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'typing') {
                typing.textContent = data.text;
                typing.classList.add('show');
            } else if (data.type === 'message') {
                typing.classList.remove('show');
                addMessage(data.sender, data.name, data.text);
            } else if (data.type === 'stream_start') {
                typing.classList.remove('show');
                currentStreamingMessage = addMessage(data.sender, data.name, '', true);
            } else if (data.type === 'stream_chunk') {
                if (currentStreamingMessage) {
                    const textDiv = currentStreamingMessage.querySelector('.message-text');
                    textDiv.textContent += data.text;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            } else if (data.type === 'stream_end') {
                if (currentStreamingMessage) {
                    currentStreamingMessage.classList.remove('streaming');
                    currentStreamingMessage = null;
                }
            }
        };
        
        function addMessage(sender, name, text, streaming = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\` + (streaming ? ' streaming' : '');
            
            const avatars = {
                user: '👤',
                kiro: '🤖',
                openclaw: '🦞',
                system: 'ℹ️'
            };
            
            const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            messageDiv.innerHTML = \`
                <div class="message-avatar">\${avatars[sender] || '💬'}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-name">\${name}</span>
                        <span class="message-time">\${time}</span>
                    </div>
                    <div class="message-text">\${text}</div>
                </div>
            \`;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            return messageDiv;
        }
        
        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            
            sendBtn.disabled = true;
            ws.send(JSON.stringify({ 
                type: 'message', 
                text: text,
                notifyKiro: notifyKiroEnabled  // 发送通知开关状态
            }));
            messageInput.value = '';
            setTimeout(() => { sendBtn.disabled = false; messageInput.focus(); }, 500);
        }
        
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendBtn.disabled) sendMessage();
        });
    </script>
</body>
</html>`;
}

const PORT = 8767;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🦞 Kiro ↔ OpenClaw 桥接服务          ║
╠════════════════════════════════════════╣
║   浏览器: http://localhost:${PORT}       ║
║   Kiro API: http://localhost:${PORT}/api/kiro/send
║                                        ║
║   Kiro 发送消息示例:                   ║
║   curl -X POST http://localhost:${PORT}/api/kiro/send \\
║     -H "Content-Type: application/json" \\
║     -d '{"message":"你好！"}'           ║
╚════════════════════════════════════════╝
  `);
});
