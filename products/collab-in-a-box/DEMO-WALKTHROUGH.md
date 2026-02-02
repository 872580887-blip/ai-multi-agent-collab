# 🎬 完整流程演示

## Collab-in-a-Box 端到端交付示例

本文档记录一次完整的诊断服务交付流程，供内部复盘或客户展示使用。

---

## 📋 场景设定

**客户问题**：Node.js 应用内存泄漏，heapUsed 持续增长至 2.4GB

**客户提供**：
- 错误日志片段
- 内存快照文件（可选）
- 相关代码片段

**期望输出**：
- 泄漏根因分析
- 可执行修复代码
- PDF 诊断报告

---

## 🚀 Step 1: 客户填写任务说明书

客户打开 `task-template.md`，填写：

```markdown
# 📋 任务说明书

## 🔹 基本信息
- **发起人**：张三（某科技公司后端工程师）
- **日期**：2026-02-02

## 🔹 任务目标
请分析这份 Node.js 内存快照，指出泄漏对象及其引用链。

## 🔹 输入材料
- 日志片段：
  ```log
  [2026-02-02 22:15:33] FATAL memory leak detected: heapUsed=2.4GB
  [2026-02-02 22:15:34] Process will be killed in 60s
  ```
- 内存快照：heap-snapshot-20260202.heapsnapshot（已上传）

## 🔹 期望输出
- [x] 中文详细分析报告（含截图）
- [x] 可执行修复建议（代码片段）
- [x] PDF 版本（带签名栏）
```

---

## 🚀 Step 2: 启动诊断会话

服务提供方（你）执行：

```bash
cd /Users/mac/Desktop/是/ai-multi-agent-collab/products/collab-in-a-box/
chmod +x diagnose-session.sh
./diagnose-session.sh --task "分析内存泄漏：heapUsed=2.4GB，已提供快照文件" --timeout 15m
```

**终端输出**：
```
📁 创建临时会话目录：/var/folders/tmp/collab-session-abc123
🌐 启动桥接服务（端口 8768）→ PID 12345
🤖 启动 RPA 通知器 → PID 12346
📩 已写入任务：分析内存泄漏：heapUsed=2.4GB，已提供快照文件
⏳ 开始诊断会话（超时：15m）...
```

---

## 🚀 Step 3: AI 协作诊断（自动进行）

### 3.1 Kiro 接收任务
- RPA 自动聚焦 Kiro IDE
- 输入任务描述
- Kiro 开始分析

### 3.2 Kiro 调用工具
```
[22:15:35] Kiro: 收到任务，正在加载内存快照...
[22:15:36] Kiro: 启动 browser 工具，打开 Chrome DevTools Memory 面板
[22:15:40] Kiro: 快照加载完成，发现 ArrayBuffer 占用 2.1GB
```

### 3.3 OpenClaw 深度分析
```
[22:15:42] OpenClaw: 接收 Kiro 的初步分析
[22:15:43] OpenClaw: 追踪 ArrayBuffer 引用链...
[22:15:45] OpenClaw: 定位到 WebWorker 中未释放的 transferable 对象
[22:15:46] OpenClaw: 生成修复代码建议
```

### 3.4 协作完成
```
[22:15:50] Kiro: 收到 OpenClaw 的分析结果
[22:15:51] Kiro: 整合报告，写入 report-final.md
✅ 报告已生成
🎉 会话成功完成！报告已生成。
```

---

## 🚀 Step 4: 查看生成的报告

打开 `/var/folders/tmp/collab-session-abc123/report-final.md`：

```markdown
# 📄 AI 协作诊断报告
**任务编号**：`COLLAB-20260202-ABC123`
**生成时间**：`2026-02-02 22:15:51`

---

## 🎯 任务回顾
> *"分析内存泄漏：heapUsed=2.4GB，已提供快照文件"*

---

## 🔍 分析过程（三方协同记录）
| 时间 | 角色 | 动作 |
|------|------|------|
| `22:15:35` | 用户 | 提交任务，附内存快照 |
| `22:15:36` | Kiro | 启动 `browser` 加载 Chrome DevTools Memory 面板 |
| `22:15:42` | OpenClaw | 解析快照 → 定位 `ArrayBuffer` 引用链 → 输出关键路径 |

---

## ✅ 结论与建议

### 1. 泄漏对象
- **类型**：`ArrayBuffer`
- **大小**：2.1GB
- **数量**：约 1,200 个未释放实例

### 2. 根本原因
`WebWorker` 中使用 `postMessage` 传递大型 `ArrayBuffer` 时，未使用 `transferable` 参数，导致数据被复制而非转移，原始对象无法被 GC 回收。

### 3. 修复代码
```js
// ❌ 错误写法（会导致内存泄漏）
worker.postMessage(data);

// ✅ 正确写法（转移所有权，原对象可被回收）
worker.postMessage(data, [data.buffer]);
```

### 4. 验证方法
修复后重新运行，观察 `process.memoryUsage().heapUsed` 是否稳定在 200MB 以下。

---

## ✍️ 协作签名
- **Kiro（IDE AI）**：已完成工具调用与报告整合
- **OpenClaw（CLI AI）**：已完成深度分析与代码建议
- **用户（张三）**：________________（请签名确认）
```

---

## 🚀 Step 5: 导出 PDF 并交付

```bash
# 安装 pandoc（如未安装）
brew install pandoc

# 导出 PDF
pandoc /var/folders/tmp/collab-session-abc123/report-final.md -o report-20260202.pdf

# 发送给客户
# 方式1：邮件附件
# 方式2：微信文件传输
# 方式3：上传到云盘分享链接
```

---

## 🚀 Step 6: 客户反馈与后续

**客户反馈**：
> "太棒了！按照建议修改后，内存占用从 2.4GB 降到了 180MB，问题完全解决！报告写得很清楚，代码可以直接用。"

**后续服务**：
- 客户购买了 6 次套餐（¥299.99）
- 获得协作健康度周报
- 成为长期合作伙伴

---

## 📊 交付统计

| 指标 | 数值 |
|------|------|
| **总耗时** | 16 分钟 |
| **AI 协作轮次** | 3 轮 |
| **报告字数** | 1,200 字 |
| **代码建议** | 2 个可执行片段 |
| **客户满意度** | ⭐⭐⭐⭐⭐ (5/5) |

---

## 💡 经验总结

### 做得好的地方
✅ 快速定位问题根因（16分钟）  
✅ 提供可执行代码（客户直接采用）  
✅ 报告结构清晰，易于理解  
✅ 三方签名增强信任感

### 可改进的地方
🔸 可以添加更多截图（Chrome DevTools 界面）  
🔸 可以提供性能对比图表（修复前后）  
🔸 可以录制修复过程的视频演示

---

**这就是一次完整的 Collab-in-a-Box 交付流程！**

*准备好接你的第一单了吗？* 🚀
