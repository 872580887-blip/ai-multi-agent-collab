#!/bin/bash

# 🚀 AI 多智能体协作系统 - 一键安装脚本

set -e  # 遇到错误立即退出

echo "╔════════════════════════════════════════╗"
echo "║   🤖 AI 多智能体协作系统安装器        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装："
    echo "   brew install node"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低（需要 >= 16.0.0）"
    echo "   当前版本: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 检查 fswatch
echo ""
echo "📦 检查 fswatch..."
if ! command -v fswatch &> /dev/null; then
    echo "⚠️  未找到 fswatch，正在安装..."
    if command -v brew &> /dev/null; then
        brew install fswatch
        echo "✅ fswatch 安装完成"
    else
        echo "❌ 未找到 Homebrew，请手动安装 fswatch："
        echo "   brew install fswatch"
        exit 1
    fi
else
    echo "✅ fswatch 已安装"
fi

# 安装 npm 依赖
echo ""
echo "📦 安装 npm 依赖..."
npm install
echo "✅ 依赖安装完成"

# 创建消息队列目录
echo ""
echo "📁 创建消息队列目录..."
mkdir -p ../.kiro-chat-messages
echo "✅ 目录创建完成: .kiro-chat-messages/"

# 检查辅助功能权限
echo ""
echo "🔐 检查辅助功能权限..."
echo "⚠️  RPA 通知器需要「辅助功能」权限才能自动输入"
echo ""
echo "请按照以下步骤操作："
echo "1. 打开「系统设置」→「隐私与安全性」→「辅助功能」"
echo "2. 点击左下角的锁图标解锁"
echo "3. 添加「终端」或「iTerm」"
echo "4. 勾选启用"
echo ""
read -p "已完成权限设置？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  请完成权限设置后再运行系统"
fi

# 完成
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ 安装完成！                        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🚀 启动系统："
echo "   npm run dev"
echo ""
echo "或分别启动："
echo "   npm run start      # 启动桥接服务器"
echo "   npm run notifier   # 启动 RPA 通知器"
echo ""
echo "📖 查看文档："
echo "   cat docs/quick-start.md"
echo ""
echo "🌐 浏览器访问："
echo "   http://localhost:8767"
echo ""
