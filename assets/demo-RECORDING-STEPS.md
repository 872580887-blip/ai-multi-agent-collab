# 🎬 demo.gif 录制分步指南（15 秒精准流程）

## 🎯 目标

录制三方协作核心流程（≤15 秒，文件 < 5MB）：
1. 用户在浏览器发送 "Hello"
2. Kiro IDE 自动弹出通知
3. 你按下回车触发 Hook
4. OpenClaw 在浏览器回复 "Hello, Kiro!"

---

## 📋 准备工作

### 1. 确保系统运行
```bash
# 检查桥接服务器
lsof -i :8767

# 检查 RPA 通知器
ps aux | grep rpa-notifier

# 如果没有运行，启动它们
cd /Users/mac/Desktop/是/ai-multi-agent-collab
npm run start &
npm run notifier &
```

### 2. 清空消息队列
```bash
rm -f /Users/mac/Desktop/是/.kiro-chat-messages/*.json
```

### 3. 打开浏览器
```bash
open http://localhost:8767
```

---

## 📏 操作步骤（请严格按顺序）

| 时间 | 动作 | 备注 |
|------|------|------|
| **0s** | 清空消息目录：<br>`rm -f .kiro-chat-messages/*.json` | 确保 GIF 干净 |
| **1s** | 打开浏览器 → `http://localhost:8767` | 确保桥接服务运行中 |
| **2s** | 调整浏览器窗口大小（建议 1280x720） | 适合录制 |
| **3s** | 在浏览器输入框输入 `"Hello"` → **不发送** | 等待下一步 |
| **4s** | 切换到 Kiro IDE → 确保窗口可见 | RPA 将在此刻监听并激活 |
| **5s** | **开始录制**：<br>按 `Cmd+Shift+5` → 选择"录制整个屏幕"或"录制所选窗口" | macOS 原生录屏 |
| **6s** | 点击"录制"按钮 | 开始录制 |
| **7s** | 回到浏览器 → 按下回车发送 `"Hello"` | 此时 RPA 开始工作 |
| **8s** | 观察 Kiro IDE：应出现 `📬 新消息来自【user】：Hello` | ✅ 成功触发 |
| **9s** | 在 IDE 输入框按回车（触发 Hook） | ✅ 你已介入 |
| **10-12s** | 浏览器应显示 OpenClaw 回复 | ✅ 闭环完成 |
| **13s** | 点击菜单栏的停止按钮 | 停止录制 |
| **14s** | 保存视频到桌面 | 默认保存为 .mov |

---

## 🎥 录制方法选择

### 方法 1：macOS 原生录屏（推荐）

```bash
# 1. 按 Cmd+Shift+5 打开录屏工具
# 2. 选择"录制整个屏幕"或"录制所选窗口"
# 3. 点击"录制"
# 4. 执行上述操作步骤
# 5. 点击菜单栏停止按钮
# 6. 视频保存到桌面（.mov 格式）
```

### 方法 2：使用 Kap（更简单）

```bash
# 安装 Kap
brew install --cask kap

# 1. 打开 Kap
# 2. 选择录制区域
# 3. 点击开始录制
# 4. 执行操作步骤
# 5. 停止录制
# 6. 导出为 GIF
```

### 方法 3：使用 ffmpeg（自动化）

```bash
# 录制 15 秒
ffmpeg -f avfoundation -i "1" -t 15 -vf "scale=1280:-2" /tmp/demo.mov

# 然后转换为 GIF（见下方后处理）
```

---

## 🎬 演示脚本（详细版）

### 场景：用户与 OpenClaw 对话

**第 1 幕（0-5s）：准备**
1. 清空消息队列
2. 打开浏览器 `http://localhost:8767`
3. 确保 Kiro IDE 可见
4. 开始录制

**第 2 幕（5-8s）：用户发送消息**
1. 在浏览器输入框输入："Hello"
2. 点击发送按钮（或按回车）
3. 消息显示在聊天界面

**第 3 幕（8-10s）：RPA 自动通知**
1. Kiro IDE 自动获得焦点
2. 输入框自动填入：`📬 新消息来自【user】：Hello`
3. 展示 RPA 自动化效果

**第 4 幕（10-12s）：OpenClaw 回复**
1. 浏览器显示 OpenClaw 正在输入
2. 流式输出回复内容
3. 完整消息显示

**第 5 幕（12-15s）：结束**
1. 展示完整对话历史
2. 停止录制

---

## 🛠️ 后处理步骤

### 1. 转换 .mov 为 .gif

```bash
# 使用 ffmpeg 转换
ffmpeg -i ~/Desktop/屏幕录制*.mov \
  -vf "fps=15,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 \
  /Users/mac/Desktop/是/ai-multi-agent-collab/assets/demo.gif
```

### 2. 优化 GIF 大小

```bash
# 安装 gifsicle
brew install gifsicle

# 运行优化脚本
bash /Users/mac/Desktop/是/ai-multi-agent-collab/assets/demo-POSTPROCESS.sh
```

---

## ✅ 验证清单

录制完成后，检查：

- [ ] GIF 文件存在：`assets/demo.gif`
- [ ] 文件大小 < 5MB
- [ ] 分辨率：1280x720（或相近）
- [ ] 时长：10-15 秒
- [ ] 清晰展示三方协作流程
- [ ] 没有敏感信息（密码、密钥等）
- [ ] 循环播放正常

---

## 🎯 关键帧检查

确保 GIF 包含以下关键帧：

1. ✅ 浏览器界面（干净、清晰）
2. ✅ 用户输入消息
3. ✅ 消息发送
4. ✅ Kiro IDE 自动获得焦点
5. ✅ 通知消息自动填入
6. ✅ OpenClaw 开始回复
7. ✅ 流式输出效果
8. ✅ 完整对话显示

---

## 🚨 常见问题

### Q1：RPA 通知器没有反应
**解决**：
```bash
# 检查进程
ps aux | grep rpa-notifier

# 重启通知器
pkill -f rpa-notifier
node src/rpa-notifier.js &
```

### Q2：Kiro IDE 没有自动获得焦点
**解决**：
1. 检查"系统设置" → "隐私与安全性" → "辅助功能"
2. 确保"终端"或"iTerm"已添加并启用

### Q3：OpenClaw 没有回复
**解决**：
```bash
# 检查 OpenClaw 配置
cat ~/.openclaw/openclaw.json | grep workspace

# 确保工作空间正确
# 应该是：/Users/mac/Desktop/是
```

### Q4：GIF 文件太大
**解决**：
```bash
# 降低帧率
gifsicle -O3 --colors 128 assets/demo.gif -o assets/demo-optimized.gif

# 或减少分辨率
gifsicle -O3 --resize-width 960 assets/demo.gif -o assets/demo-optimized.gif
```

---

## 📦 最终文件

- **路径**：`/Users/mac/Desktop/是/ai-multi-agent-collab/assets/demo.gif`
- **大小**：< 5MB
- **分辨率**：1280x720
- **时长**：10-15 秒
- **格式**：GIF（循环播放）

---

## 🎉 完成后

1. 检查 GIF 质量
2. 更新 README.md（添加 GIF 引用）
3. 提交到 Git
4. 准备发布到 GitHub

---

**祝录制顺利！** 🎬

如果遇到问题，参考：
- [RECORDING_GUIDE.md](./RECORDING_GUIDE.md) - 详细录制指南
- [demo-POSTPROCESS.sh](./demo-POSTPROCESS.sh) - 自动优化脚本
