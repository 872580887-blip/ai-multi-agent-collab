# 📦 Collab-in-a-Box —— AI 协作诊断服务

> 一次性解决你的技术难题，由 Kiro + OpenClaw 双 AI 协同诊断

## 🎯 这是什么？

**Collab-in-a-Box** 不是一个工具，而是一次**确定性的协作服务**。

当你遇到：
- 🐛 看不懂的报错日志
- 💾 内存泄漏找不到根因
- 🔧 性能瓶颈无从下手
- 📊 代码审查需要第二意见

我们提供：
- ✅ Kiro（IDE AI）+ OpenClaw（CLI AI）双重诊断
- ✅ 15-30分钟内完成分析
- ✅ 带签名的专业 PDF 报告
- ✅ 可执行的修复建议（含代码）

## 💰 定价

| 套餐 | 价格 | 包含内容 |
|------|------|----------|
| **单次诊断** | ¥49.99 | 1次协作会话 + PDF报告 |
| **6次套餐** | ¥299.99 | 6次会话 + 协作健康度周报 |
| **年度无限** | ¥999 | 无限次 + 3个RPA模板 + 优先支持 |

## 🚀 如何使用？

### 1. 填写任务说明书
打开 `task-template.md`，填写：
- 任务目标（一句话）
- 输入材料（日志/代码/链接）
- 期望输出（报告/代码/建议）

### 2. 启动诊断会话
```bash
chmod +x diagnose-session.sh
./diagnose-session.sh --task "分析内存泄漏：heapUsed=2.4GB" --timeout 15m
```

### 3. 等待报告生成
- 系统自动启动 Kiro + OpenClaw 协作
- 实时显示诊断进度
- 完成后生成 `report-final.md`

### 4. 导出 PDF（可选）
```bash
pandoc report-final.md -o report.pdf
```

## 📋 包含文件

```
collab-in-a-box/
├── diagnose-session.sh    # 启动脚本
├── task-template.md        # 任务模板
├── report-template.md      # 报告模板
├── demo.gif                # 演示动图
├── LICENSE-COMMERCIAL.md   # 商业授权
└── README.md               # 本文件
```

## ✨ 为什么选择我们？

### 不是 AI 工具，是协作范式
- ❌ 不是单个 AI 的输出
- ✅ 是两个 AI 的协同推理
- ✅ 是人机协作的最佳实践

### 零云服务，100% 本地
- ❌ 不上传你的代码
- ❌ 不依赖外部 API
- ✅ 所有数据留在你的 Mac

### 结果导向，可验证
- ✅ 带三方签名的报告
- ✅ 可执行的修复代码
- ✅ 未解决可退款

## 📞 联系我们

- **GitHub**: https://github.com/872580887-blip/ai-multi-agent-collab
- **技术支持**: 提交 Issue 或私信
- **商务合作**: 见付款页面

## 📜 授权说明

本产品采用 **MIT + 商业授权** 双重许可：
- ✅ 个人使用：完全免费
- ✅ 商业使用：需购买授权
- ❌ 不得转售源码

详见 `LICENSE-COMMERCIAL.md`

---

**真正的协作，不是替你做完，而是陪你做到最后一步。**

*—— Kiro & OpenClaw, 2026-02-02*
