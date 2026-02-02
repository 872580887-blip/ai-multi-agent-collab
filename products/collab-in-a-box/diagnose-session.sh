#!/bin/bash
# diagnose-session.sh —— Collab-in-a-Box 核心启动器
# 用法：./diagnose-session.sh --task "分析这份日志" --timeout 10m

set -e

TASK=""
TIMEOUT="10m"
TEMP_DIR=""

print_usage() {
  echo "Usage: $0 --task \"<任务描述>\" [--timeout <duration>] [--help]"
  echo "  --task      任务描述（必填）"
  echo "  --timeout   超时时间（默认 10m）"
  echo "  --help      显示此帮助"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --task)
      TASK="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      print_usage
      exit 1
      ;;
  esac
done

if [[ -z "$TASK" ]]; then
  echo "❌ 错误：--task 参数为必填项"
  print_usage
  exit 1
fi

# 自动检测项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📍 项目根目录：$PROJECT_ROOT"

# 创建临时会话目录（隔离）
TEMP_DIR=$(mktemp -d -t collab-session-XXXXXX)
echo "📁 创建临时会话目录：$TEMP_DIR"

# 启动桥接服务（监听临时目录）
node "$PROJECT_ROOT/src/bridge-server.js" \
  --message-dir "$TEMP_DIR" \
  --port 8768 > "$TEMP_DIR/bridge.log" 2>&1 &

BRIDGE_PID=$!
echo "🌐 启动桥接服务（端口 8768）→ PID $BRIDGE_PID"

# 启动 RPA 监听（监听临时目录）
node "$PROJECT_ROOT/src/rpa-notifier.js" \
  --message-dir "$TEMP_DIR" > "$TEMP_DIR/notifier.log" 2>&1 &

NOTIFIER_PID=$!
echo "🤖 启动 RPA 通知器 → PID $NOTIFIER_PID"

# 写入任务消息
TIMESTAMP=$(date +%s)
MSG_FILE="$TEMP_DIR/msg-$TIMESTAMP.json"
cat > "$MSG_FILE" << EOF
{
  "timestamp": $TIMESTAMP,
  "sender": "user",
  "senderName": "用户",
  "message": "$TASK"
}
EOF
echo "📩 已写入任务：$TASK"

# 等待超时或完成（检测 report-template.md 是否被填充）
echo "⏳ 开始诊断会话（超时：$TIMEOUT）..."
sleep 2  # 确保服务就绪

# 简单完成检测（真实版可对接 OpenClaw 回复）
if timeout "$TIMEOUT" bash -c "
  for i in {1..60}; do
    if [ -f '$TEMP_DIR/report-final.md' ]; then
      echo '✅ 报告已生成'
      exit 0
    fi
    sleep 1
  done
  echo '❌ 超时：未收到报告'
  exit 1
"; then
  echo "🎉 会话成功完成！报告已生成。"
else
  echo "⚠️  会话超时，正在清理..."
  kill $BRIDGE_PID $NOTIFIER_PID 2>/dev/null || true
  rm -rf "$TEMP_DIR"
  exit 1
fi

# 清理（保留 report-final.md）
kill $BRIDGE_PID $NOTIFIER_PID 2>/dev/null || true
echo "🧹 服务已停止，临时目录保留（含 report-final.md）"
