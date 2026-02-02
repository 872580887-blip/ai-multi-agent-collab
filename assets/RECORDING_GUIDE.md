# 🎬 演示 GIF 录制指南

## 方法 1：使用 ffmpeg（推荐 - 自动化）

### 安装 ffmpeg
```bash
brew install ffmpeg
```

### 录制整个屏幕（15秒）
```bash
ffmpeg -f avfoundation -i "1" -t 15 -vf "scale=1280:-2" assets/demo.gif
```

### 录制特定窗口（更聚焦）
```bash
# 1. 先找到窗口 ID
ffmpeg -f avfoundation -list_devices true -i ""

# 2. 录制指定窗口
ffmpeg -f avfoundation -i "1" -t 15 -vf "scale=1280:-2" assets/demo.gif
```

---

## 方法 2：使用 macOS 自带工具

### 使用 screencapture
```bash
# 录制选定区域（手动停止）
screencapture -w -o -t gif assets/demo.gif

# 然后按 Cmd+Shift+4 选择区域
```

---

## 方法 3：使用 Kap（推荐 - 最简单）

### 安装 Kap
```bash
brew install --cask kap
```

### 使用步骤
1. 打开 Kap
2. 选择录制区域（建议录制浏览器窗口）
3. 点击开始录制
4. 演示操作（见下方脚本）
5. 停止录制
6. 导出为 GIF
7. 保存到 `assets/demo.gif`

---

## 📝 演示脚本（15秒完整流程）

### 场景：用户与 OpenClaw 对话

**时间轴：**

| 时间 | 操作 | 说明 |
|------|------|------|
| 0-2s | 打开浏览器 `http://localhost:8767` | 显示三方聊天界面 |
| 2-4s | 在输入框输入："你好，OpenClaw" | 展示用户输入 |
| 4-5s | 点击发送按钮 | 消息发送 |
| 5-8s | 等待 OpenClaw 回复 | 显示流式输出 |
| 8-10s | OpenClaw 回复完成 | 完整消息显示 |
| 10-12s | 切换到 Kiro IDE | 显示自动通知 |
| 12-15s | Kiro IDE 显示通知消息 | 展示 RPA 自动化 |

---

## 🎯 录制要点

### 必须展示的功能
1. ✅ 浏览器界面（干净、清晰）
2. ✅ 用户输入消息
3. ✅ OpenClaw 实时流式回复
4. ✅ Kiro IDE 自动收到通知
5. ✅ 通知开关功能（可选）

### 录制技巧
- **分辨率**：1280x720（适合 GitHub README）
- **帧率**：15-20 FPS（GIF 文件大小合理）
- **时长**：10-15 秒（不要太长）
- **文件大小**：< 5MB（GitHub 限制）

### 优化 GIF 大小
```bash
# 使用 gifsicle 压缩
brew install gifsicle
gifsicle -O3 --colors 256 assets/demo.gif -o assets/demo-optimized.gif
```

---

## 📦 最终文件

- **路径**：`assets/demo.gif`
- **大小**：< 5MB
- **分辨率**：1280x720
- **时长**：10-15 秒

---

## 🚀 快速开始

```bash
# 1. 确保系统运行中
npm run dev

# 2. 打开浏览器
open http://localhost:8767

# 3. 开始录制（使用 Kap 或 ffmpeg）

# 4. 按照演示脚本操作

# 5. 保存到 assets/demo.gif
```

---

**提示**：如果 GIF 太大，可以：
1. 减少帧率（10 FPS）
2. 降低分辨率（960x540）
3. 缩短时长（10 秒）
4. 使用 gifsicle 压缩
