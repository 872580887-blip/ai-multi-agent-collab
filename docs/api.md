# 📚 API 文档

## 概览

AI 多智能体协作系统提供以下接口：

1. **WebSocket API** - 实时双向通信
2. **HTTP API** - Kiro 发送消息
3. **文件系统 API** - 消息队列
4. **CLI API** - OpenClaw 命令行

---

## 1. WebSocket API

### 连接地址
```
ws://localhost:8767
```

### 连接示例
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8767');

ws.on('open', () => {
  console.log('✅ 已连接到桥接服务器');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📩 收到消息:', msg);
});
```

### 消息格式

#### 发送消息
```json
{
  "type": "message",
  "sender": "your-agent-name",
  "name": "显示名称",
  "text": "消息内容",
  "timestamp": 1738516140000
}
```

#### 接收消息
```json
{
  "type": "message",
  "sender": "user",
  "name": "你",
  "text": "Hello",
  "timestamp": 1738516140000
}
```

#### 流式输出（OpenClaw 专用）
```json
{
  "type": "stream_chunk",
  "text": "部分回复内容"
}
```

#### 流式结束
```json
{
  "type": "stream_end"
}
```

### 事件类型

| 事件 | 说明 | 数据格式 |
|------|------|----------|
| `message` | 完整消息 | `{ type, sender, name, text, timestamp }` |
| `stream_chunk` | 流式输出片段 | `{ type, text }` |
| `stream_end` | 流式输出结束 | `{ type }` |

---

## 2. HTTP API

### POST /api/kiro/send

Kiro 发送消息到系统。

#### 请求
```bash
curl -X POST http://localhost:8767/api/kiro/send \
  -H 'Content-Type: application/json' \
  -d '{"message":"你的消息内容"}'
```

#### 请求体
```json
{
  "message": "消息内容（必填）"
}
```

#### 响应
```json
{
  "success": true
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 示例（Node.js）
```javascript
const fetch = require('node-fetch');

async function sendToOpenClaw(message) {
  const response = await fetch('http://localhost:8767/api/kiro/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  const result = await response.json();
  console.log('发送结果:', result);
}

sendToOpenClaw('你好，OpenClaw！');
```

---

## 3. 文件系统 API（消息队列）

### 目录位置
```
.kiro-chat-messages/
```

### 文件命名规则
```
msg-{timestamp}.json
```

### 文件格式
```json
{
  "timestamp": 1738516140000,
  "sender": "user",
  "senderName": "你",
  "message": "消息内容"
}
```

### 写入消息（通知 Kiro）
```javascript
const fs = require('fs');
const path = require('path');

function notifyKiro(sender, senderName, message) {
  const MESSAGE_DIR = path.join(__dirname, '../.kiro-chat-messages');
  const filename = `msg-${Date.now()}.json`;
  const filepath = path.join(MESSAGE_DIR, filename);
  
  const data = {
    timestamp: Date.now(),
    sender: sender,
    senderName: senderName,
    message: message
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`📁 已写入消息队列: ${filename}`);
}

notifyKiro('openclaw', 'OpenClaw', '任务已完成！');
```

### 读取消息（RPA 通知器）
```javascript
const fs = require('fs');
const path = require('path');

function processMessages() {
  const MESSAGE_DIR = path.join(__dirname, '../.kiro-chat-messages');
  
  // 获取所有 JSON 文件
  const files = fs.readdirSync(MESSAGE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(MESSAGE_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  
  if (files.length > 0) {
    const data = JSON.parse(fs.readFileSync(files[0], 'utf8'));
    console.log('📩 收到消息:', data);
    
    // 处理完成后删除
    fs.unlinkSync(files[0]);
  }
}
```

---

## 4. CLI API（OpenClaw）

### 命令格式
```bash
node /Users/mac/Desktop/是/openclaw/openclaw.mjs agent \
  --to main \
  --message "你的消息" \
  --thinking low
```

### 参数说明

| 参数 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| `--to` | 目标 Agent | 是 | - |
| `--message` | 消息内容 | 是 | - |
| `--thinking` | 思考级别 | 否 | `low` |

### 思考级别

| 级别 | 说明 | 适用场景 |
|------|------|----------|
| `low` | 快速响应 | 简单问答 |
| `medium` | 平衡模式 | 一般任务 |
| `high` | 深度思考 | 复杂问题 |

### 调用示例（Node.js）
```javascript
const { spawn } = require('child_process');

function callOpenClaw(message) {
  const openclaw = spawn('/opt/homebrew/opt/node@22/bin/node', [
    '/Users/mac/Desktop/是/openclaw/openclaw.mjs',
    'agent',
    '--to', 'main',
    '--message', message,
    '--thinking', 'low'
  ], {
    cwd: '/Users/mac/Desktop/是/openclaw'
  });
  
  // 实时输出
  openclaw.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  // 错误处理
  openclaw.stderr.on('data', (data) => {
    console.error('错误:', data.toString());
  });
  
  // 完成
  openclaw.on('close', (code) => {
    console.log(`OpenClaw 退出，代码: ${code}`);
  });
}

callOpenClaw('你好，OpenClaw！');
```

---

## 5. RPA 自动化 API

### 配置文件位置
```
src/rpa-notifier.js
```

### 自定义通知格式
编辑第 26 行：
```javascript
const formatted = `📬 新消息来自【${sender}】：${message}`;
```

### 自定义消息目录
编辑第 13 行：
```javascript
const MESSAGE_DIR = path.join(__dirname, '../.kiro-chat-messages');
```

### 自定义应用名称
编辑第 35 行：
```javascript
exec('osascript -e \'tell application "Kiro" to activate\'');
```

---

## 6. 完整集成示例

### 场景：自定义 Agent 接入系统

```javascript
#!/usr/bin/env node

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// 配置
const BRIDGE_URL = 'ws://localhost:8767';
const AGENT_NAME = 'my-agent';
const AGENT_DISPLAY_NAME = '我的 AI';
const MESSAGE_DIR = path.join(__dirname, '../.kiro-chat-messages');

// 连接 WebSocket
const ws = new WebSocket(BRIDGE_URL);

ws.on('open', () => {
  console.log(`✅ ${AGENT_DISPLAY_NAME} 已连接`);
  sendMessage('你好！我已准备就绪。');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  // 只处理发给自己的消息
  if (msg.type === 'message' && msg.sender !== AGENT_NAME) {
    handleMessage(msg);
  }
});

// 处理消息
function handleMessage(msg) {
  console.log(`📩 收到消息 [${msg.name}]: ${msg.text}`);
  
  // 你的 AI 逻辑
  const reply = `收到你的消息："${msg.text}"`;
  
  // 发送回复
  sendMessage(reply);
  
  // 通知 Kiro
  notifyKiro(reply);
}

// 发送消息（WebSocket）
function sendMessage(text) {
  const message = {
    type: 'message',
    sender: AGENT_NAME,
    name: AGENT_DISPLAY_NAME,
    text: text,
    timestamp: Date.now()
  };
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// 通知 Kiro（文件系统）
function notifyKiro(message) {
  const filename = `msg-${Date.now()}.json`;
  const filepath = path.join(MESSAGE_DIR, filename);
  
  const data = {
    timestamp: Date.now(),
    sender: AGENT_NAME,
    senderName: AGENT_DISPLAY_NAME,
    message: message
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭...');
  sendMessage('我要下线了，再见！');
  setTimeout(() => ws.close(), 500);
});
```

---

## 7. 错误处理

### WebSocket 连接失败
```javascript
ws.on('error', (err) => {
  console.error('❌ WebSocket 错误:', err.message);
  
  // 重连逻辑
  setTimeout(() => {
    console.log('🔄 尝试重新连接...');
    reconnect();
  }, 5000);
});
```

### HTTP 请求失败
```javascript
try {
  const response = await fetch('http://localhost:8767/api/kiro/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'test' })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log('✅ 发送成功:', result);
} catch (err) {
  console.error('❌ 发送失败:', err.message);
}
```

### 文件系统错误
```javascript
try {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log('✅ 文件写入成功');
} catch (err) {
  console.error('❌ 文件写入失败:', err.message);
  
  // 确保目录存在
  if (!fs.existsSync(MESSAGE_DIR)) {
    fs.mkdirSync(MESSAGE_DIR, { recursive: true });
  }
}
```

---

## 8. 性能优化

### WebSocket 心跳
```javascript
// 每 30 秒发送心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000);

ws.on('pong', () => {
  console.log('💓 心跳正常');
});
```

### 消息队列清理
```javascript
// 定期清理旧消息（超过 1 小时）
setInterval(() => {
  const files = fs.readdirSync(MESSAGE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(MESSAGE_DIR, f));
  
  const now = Date.now();
  files.forEach(file => {
    const stat = fs.statSync(file);
    const age = now - stat.mtimeMs;
    
    // 删除超过 1 小时的文件
    if (age > 3600000) {
      fs.unlinkSync(file);
      console.log(`🗑️ 清理旧消息: ${path.basename(file)}`);
    }
  });
}, 600000); // 每 10 分钟检查一次
```

---

## 9. 安全建议

1. **本地运行**：不要暴露到公网
2. **输入验证**：检查消息内容，防止注入
3. **文件权限**：确保消息队列目录权限正确
4. **错误处理**：捕获所有异常，避免崩溃

---

## 10. 调试技巧

### 查看 WebSocket 消息
```javascript
ws.on('message', (data) => {
  console.log('📥 原始消息:', data.toString());
  const msg = JSON.parse(data.toString());
  console.log('📦 解析后:', msg);
});
```

### 监控消息队列
```bash
# 实时监控
watch -n 1 'ls -lt .kiro-chat-messages/ | head -10'

# 查看最新消息
cat .kiro-chat-messages/msg-*.json | tail -1 | jq .
```

### 测试 API
```bash
# 测试 HTTP API
curl -X POST http://localhost:8767/api/kiro/send \
  -H 'Content-Type: application/json' \
  -d '{"message":"测试消息"}' \
  -v

# 测试 WebSocket（使用 wscat）
npm install -g wscat
wscat -c ws://localhost:8767
```

---

## 📞 获取帮助

- **GitHub Issues**：报告 Bug
- **GitHub Discussions**：技术讨论
- **示例代码**：`examples/custom-agent.js`

---

**最后更新**：2026-02-02
