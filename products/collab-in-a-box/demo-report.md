# AI 协作诊断报告

**客户ID**: COLLAB-DEMO-001  
**诊断时间**: 2026-02-02 22:30  
**诊断时长**: 18 分钟  
**诊断师**: Kiro + OpenClaw  

---

## 📋 问题描述

客户反馈：

> WebSocket 连接每隔 5 分钟就会断开，客户端显示 `WebSocket connection closed`。
> 
> 日志显示：
> ```
> [2026-02-02 14:23:45] WebSocket connection closed
> [2026-02-02 14:28:47] WebSocket connection closed
> [2026-02-02 14:33:49] WebSocket connection closed
> ```
> 
> 前端代码已经实现了自动重连，但用户体验很差。

**环境信息**:
- 后端：Node.js 18.x + Express + ws 库
- 前端：Vue 3 + 原生 WebSocket API
- 部署：Nginx 反向代理

---

## 🔍 根因分析

### Kiro 的初步分析

Kiro 首先检查了客户端代码，发现重连逻辑正常：

```javascript
// 客户端重连逻辑（正常）
ws.onclose = () => {
  setTimeout(() => {
    reconnect();
  }, 3000);
};
```

Kiro 建议："问题可能不在客户端，而在服务端或网络层。"

### OpenClaw 的深度分析

OpenClaw 调用了 `browser` 工具，查阅了 Nginx 官方文档，发现关键配置：

> Nginx 默认的 `proxy_read_timeout` 是 **60 秒**。
> 
> 如果 WebSocket 连接在 60 秒内没有数据传输，Nginx 会主动关闭连接。

OpenClaw 进一步分析客户的日志时间间隔：
- 14:23:45 → 14:28:47 = **5分2秒**
- 14:28:47 → 14:33:49 = **5分2秒**

**结论**：客户的 WebSocket 心跳间隔是 **5 分钟**，远超 Nginx 的 60 秒超时。

### 协作结论

**根本原因**：Nginx 配置的 `proxy_read_timeout` 太短（60秒），而 WebSocket 心跳间隔太长（5分钟），导致 Nginx 认为连接空闲而主动关闭。

---

## ✅ 修复方案

### 方案一：调整 Nginx 超时时间 [推荐]

**修改文件**: `/etc/nginx/sites-available/your-site.conf`

**定位到 WebSocket 代理配置**:
```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # ❌ 缺少这两行配置
}
```

**添加超时配置**:
```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # ✅ 添加以下配置
    proxy_read_timeout 600s;      # 10分钟
    proxy_send_timeout 600s;      # 10分钟
    proxy_connect_timeout 10s;    # 连接超时10秒
}
```

**重启 Nginx**:
```bash
sudo nginx -t                    # 检查配置
sudo systemctl reload nginx      # 重载配置
```

**原理**：
- `proxy_read_timeout 600s` 允许 WebSocket 连接在 10 分钟内无数据传输
- 客户的心跳间隔是 5 分钟，完全在安全范围内

---

### 方案二：缩短心跳间隔 [备选]

如果无法修改 Nginx 配置（如使用托管服务），可以缩短客户端心跳间隔。

**修改文件**: `frontend/src/websocket.js`

**原代码**:
```javascript
// 每 5 分钟发送一次心跳
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 5 * 60 * 1000);  // ❌ 5分钟
```

**修复后**:
```javascript
// 每 30 秒发送一次心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30 * 1000);  // ✅ 30秒
```

**原理**：
- 30 秒 < 60 秒（Nginx 默认超时），确保连接不会被关闭
- 增加了 `readyState` 检查，避免在连接断开时发送心跳

---

## 🛡️ 预防建议

为避免类似问题再次发生，建议：

### 1. 标准化 WebSocket 配置

创建 Nginx 配置模板 `nginx-websocket-template.conf`：

```nginx
# WebSocket 标准配置模板
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # 超时配置（根据业务调整）
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    proxy_connect_timeout 10s;
    
    # 缓冲配置
    proxy_buffering off;
}
```

### 2. 添加连接监控

在后端添加 WebSocket 连接监控：

```javascript
// server.js
wss.on('connection', (ws) => {
  console.log(`[${new Date().toISOString()}] WebSocket connected`);
  
  ws.on('close', (code, reason) => {
    console.log(`[${new Date().toISOString()}] WebSocket closed: ${code} ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] WebSocket error:`, error);
  });
});
```

### 3. 实现心跳检测

在服务端也实现心跳检测，主动关闭僵尸连接：

```javascript
// server.js
const HEARTBEAT_INTERVAL = 30000; // 30秒
const HEARTBEAT_TIMEOUT = 60000;  // 60秒

wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  const interval = setInterval(() => {
    if (ws.isAlive === false) {
      console.log('Client not responding, terminating connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

---

## 📊 诊断数据

- **分析的日志行数**: 127 行
- **定位的关键配置**: 1 处（Nginx proxy_read_timeout）
- **提供的修复方案**: 2 个（推荐方案 + 备选方案）
- **预计修复时间**: 5 分钟（方案一）或 10 分钟（方案二）
- **AI 协作轮次**: 7 轮对话
- **调用的工具**: browser（查阅文档）、terminal（检查配置）

---

## 📞 后续支持

如果按照此方案修复后仍有问题，请联系：
- **微信**: [你的微信号]
- **免费复诊**: 7 天内
- **响应时间**: 工作日 2 分钟内

---

## 🎯 验证步骤

修复后，请按以下步骤验证：

1. **重启 Nginx**（如果使用方案一）
   ```bash
   sudo systemctl reload nginx
   ```

2. **清除浏览器缓存**，重新打开页面

3. **观察 10 分钟**，检查是否还有断连

4. **查看 Nginx 日志**
   ```bash
   tail -f /var/log/nginx/access.log | grep ws
   ```

5. **预期结果**：10 分钟内无断连，心跳正常

---

**诊断师签名**: Kiro & OpenClaw  
**报告生成时间**: 2026-02-02 22:48  
**报告编号**: COLLAB-DEMO-001  

---

<div style="text-align: center; color: #999; font-size: 0.9em; margin-top: 50px;">
  <p>⚠️ 本报告为演示样例，带有 DEMO 水印</p>
  <p>真实报告不含水印，且根据实际问题定制</p>
  <p>本报告由 AI 协作生成，已经人工审核确认</p>
</div>
