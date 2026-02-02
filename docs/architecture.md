# 🏗️ 系统架构详解

## 📐 整体架构图

```
┌─────────────────┐    HTTP/WebSocket     ┌──────────────────┐
│   浏览器用户    │◄────────────────────►│ bridge-server.js │
└────────┬────────┘                       └────────┬─────────┘
         │                                             │
         │  JSON 消息队列（原子写入）                   │
         ▼                                             ▼
┌─────────────────┐                          ┌──────────────────┐
│ .kiro-chat-messages/ │                          │  OpenClaw CLI     │
│  msg-*.json      │◄───────────────────────►│ (agent --to main) │
└────────┬────────┘                          └────────┬─────────┘
         │                                             │
         │  macOS RPA 自动化（fswatch + osascript）     │
         ▼                                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        Kiro IDE（Electron）                           │
│  ←─ RPA 自动聚焦 → 输入 "📬 新消息来自【user】：..." → 回车触发 Hook  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 核心组件

### 1. Bridge Server（桥接服务器）

**文件**：`src/bridge-server.js`

**职责**：
- WebSocket 服务器，处理实时通信
- HTTP API，接收 Kiro 的消息
- 消息路由，广播给所有客户端
- 调用 OpenClaw CLI

**关键代码**：
```javascript
// WebSocket 连接管理
const clients = new Set();

// 广播消息
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 调用 OpenClaw
function callOpenClawStreaming(message) {
  const openclaw = spawn('/opt/homebrew/opt/node@22/bin/node', [
    '/Users/mac/Desktop/是/openclaw/openclaw.mjs',
    'agent',
    '--to', 'main',
    '--message', message,
    '--thinking', 'low'
  ], {
    cwd: '/Users/mac/Desktop/是/openclaw'
  });
  
  // 实时流式输出
  openclaw.stdout.on('data', (data) => {
    broadcast({
      type: 'stream_chunk',
      text: data.toString()
    });
  });
}
```

**端口**：8767

**API 端点**：
- `GET /` - 浏览器界面
- `POST /api/kiro/send` - Kiro 发送消息
- `GET /api/status` - 系统状态

---

### 2. RPA Notifier（RPA 通知器）

**文件**：`src/rpa-notifier.js`

**职责**：
- 监听消息队列目录（`.kiro-chat-messages/`）
- 检测到新消息时，自动激活 Kiro IDE
- 使用剪贴板粘贴消息（避免特殊字符问题）
- 模拟按键发送消息

**关键代码**：
```javascript
// 使用 fswatch 监听目录
const fswatch = spawn('fswatch', ['-o', MESSAGE_DIR]);

fswatch.stdout.on('data', () => {
  // 扫描目录找最新 .json
  const files = fs.readdirSync(MESSAGE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(MESSAGE_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  
  if (files.length > 0) {
    processFile(files[0]); // 处理最新一个
  }
});

// 处理消息文件
function processFile(filepath) {
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const formatted = `📬 新消息来自【${data.sender}】：${data.message}`;
  
  // 1. 写入剪贴板
  exec(`printf '%s' ${JSON.stringify(formatted)} | pbcopy`);
  
  // 2. 激活 Kiro IDE
  exec('osascript -e \'tell application "Kiro" to activate\'');
  
  // 3. 粘贴（Cmd+V）
  exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'');
  
  // 4. 按回车
  exec('osascript -e \'tell application "System Events" to key code 36\'');
  
  // 5. 删除已处理的文件
  fs.unlinkSync(filepath);
}
```

**依赖**：
- `fswatch`（文件监听）
- `osascript`（macOS 自动化）
- `pbcopy`（剪贴板操作）

---

### 3. Message Queue（消息队列）

**目录**：`.kiro-chat-messages/`

**格式**：JSON 文件

**命名规则**：`msg-{timestamp}.json`

**文件结构**：
```json
{
  "timestamp": 1738516140000,
  "sender": "user",
  "senderName": "你",
  "message": "你好"
}
```

**特点**：
- **原子性**：每个文件独立，不会冲突
- **持久化**：文件系统自动持久化
- **可追溯**：可以用 `cat`、`ls`、`tail -f` 查看
- **零依赖**：不需要数据库

**调试命令**：
```bash
# 查看所有消息
ls -lt .kiro-chat-messages/

# 查看最新消息
cat .kiro-chat-messages/msg-*.json | tail -1

# 实时监控
tail -f .kiro-chat-messages/msg-*.json
```

---

## 🔄 消息流转

### 场景 1：用户 → OpenClaw

```
1. 用户在浏览器输入消息
   ↓
2. WebSocket 发送到 Bridge Server
   ↓
3. Bridge Server 广播消息（显示在界面）
   ↓
4. Bridge Server 创建 JSON 文件到消息队列
   ↓
5. Bridge Server 调用 OpenClaw CLI
   ↓
6. OpenClaw 实时流式输出
   ↓
7. Bridge Server 广播 OpenClaw 的回复
   ↓
8. 浏览器实时显示回复
```

### 场景 2：OpenClaw → Kiro IDE

```
1. OpenClaw 回复完成
   ↓
2. Bridge Server 创建 JSON 文件到消息队列
   ↓
3. fswatch 检测到新文件
   ↓
4. RPA Notifier 读取 JSON
   ↓
5. RPA Notifier 激活 Kiro IDE
   ↓
6. RPA Notifier 粘贴消息
   ↓
7. RPA Notifier 按回车发送
   ↓
8. Kiro IDE 显示通知
```

### 场景 3：Kiro → OpenClaw

```
1. Kiro 执行 curl 命令
   ↓
2. POST 请求到 /api/kiro/send
   ↓
3. Bridge Server 广播消息
   ↓
4. Bridge Server 调用 OpenClaw CLI
   ↓
5. OpenClaw 回复
   ↓
6. 回到场景 2（通知 Kiro）
```

---

## 🎯 设计原则

### 1. 简单优于复杂
- 不用 Redis，用文件系统
- 不用 RabbitMQ，用 WebSocket
- 不用数据库，用 JSON 文件

### 2. 透明优于黑盒
- 所有消息都是可读的 JSON
- 可以用标准 Unix 工具调试
- 没有隐藏的状态

### 3. 本地优于云端
- 所有数据在本地
- 不依赖网络服务
- 隐私完全可控

### 4. 实时优于批处理
- WebSocket 实时通信
- fswatch 毫秒级监听
- 无需轮询

---

## 🔐 安全考虑

### 1. 本地运行
- 所有服务在 localhost
- 不暴露到公网
- 数据不离开本机

### 2. 文件权限
- 消息队列目录权限：`drwxr-xr-x`
- 只有当前用户可写

### 3. 进程隔离
- Bridge Server 独立进程
- RPA Notifier 独立进程
- OpenClaw 独立进程

---

## 📊 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 消息延迟 | < 100ms | WebSocket 实时通信 |
| 通知延迟 | < 500ms | fswatch + RPA |
| 并发连接 | 100+ | WebSocket 支持 |
| 内存占用 | < 50MB | 所有进程总和 |
| CPU 占用 | < 5% | 空闲时 |

---

## 🔧 扩展性

### 添加新的 AI Agent

1. 连接到 WebSocket 服务器
2. 监听消息事件
3. 发送回复

参考：`examples/custom-agent.js`

### 跨平台支持

- **Windows**：用 AutoHotkey 替代 osascript
- **Linux**：用 xdotool 替代 osascript
- **核心逻辑**：保持不变

---

## 📚 技术栈

- **Node.js**：运行时环境
- **WebSocket**：实时通信
- **fswatch**：文件监听
- **osascript**：macOS 自动化
- **JSON**：数据格式

---

**下一步**：查看 [快速开始](./quick-start.md) 运行系统
