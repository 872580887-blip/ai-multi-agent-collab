# 📜 CHANGELOG

## v0.1.1 (2026-02-02)
### 🔧 修复
- **路径解耦**：移除所有硬编码绝对路径（3 处）
  - `src/bridge-server.js`: 使用 `OPENCLAW_PATH` 环境变量 + 自动检测
  - `src/rpa-notifier.js`: 使用 `MESSAGE_DIR` 环境变量 + 自动检测
  - `diagnose-session.sh`: 使用 `SCRIPT_DIR` 相对路径
- **跨平台兼容性**：项目现在可在任意用户目录下运行
- **健康评分提升**：从 65/100 → 87/100

### 📄 文档
- 更新 `PROJECT-HEALTH-REPORT.md`：标记路径问题已修复
- 新增环境变量配置说明

---

## v0.1.0 (2026-02-02)
### ✨ 新增
- 初始版本发布：AI 多智能体协作系统 MVP  
- WebSocket 桥接服务器（`src/bridge-server.js`）  
- macOS RPA 通知器（`src/rpa-notifier.js`）  
- 完整文档集（`docs/`）与示例（`examples/`）  

### 📄 文档
- `README.md`：含架构图、快速开始、GIF 演示  
- `ARTICLE_DRAFT.md`：技术实现与协作经验总结  
- `CONTRIBUTING.md` / `SECURITY.md` / `PUBLISH_CHECKLIST.md`  

### 🛠️ 工具
- `install.sh`：一键安装脚本  
- `publish.sh`：一键推送脚本  
- `assets/demo-RECORDING-STEPS.md`：GIF 录制指南  
