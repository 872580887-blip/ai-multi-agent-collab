#!/bin/bash
# AI 多智能体协作系统 - GitHub 发布脚本

echo "🚀 AI 多智能体协作系统 - GitHub 发布"
echo ""
echo "⚠️  请先在浏览器中创建 GitHub 仓库："
echo "   1. 访问：https://github.com/new"
echo "   2. 仓库名：ai-multi-agent-collab"
echo "   3. 描述：让多个 AI 实时协同工作的完整解决方案"
echo "   4. 可见性：Public"
echo "   5. 不要勾选 'Initialize with README'"
echo "   6. 点击 'Create repository'"
echo ""
read -p "已创建仓库？按回车继续..." 

# 检查是否已有远程仓库
if git remote | grep -q origin; then
    echo "🔗 移除旧的远程仓库..."
    git remote remove origin
fi

# 添加远程仓库
echo "🔗 添加远程仓库..."
git remote add origin https://github.com/872580887-blip/ai-multi-agent-collab.git

# 确保在 main 分支
echo "📝 切换到 main 分支..."
git branch -M main

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 发布成功！"
    echo ""
    echo "🌐 仓库地址："
    echo "   https://github.com/872580887-blip/ai-multi-agent-collab"
    echo ""
    echo "📊 下一步："
    echo "   1. 查看 README：https://github.com/872580887-blip/ai-multi-agent-collab#readme"
    echo "   2. 告诉 OpenClaw：'已推送' → 生成推文草稿"
    echo "   3. 或说：'我们来发掘金吧' → 发布技术文章"
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "可能的原因："
    echo "   1. 仓库还未创建"
    echo "   2. 没有推送权限"
    echo "   3. 网络问题"
    echo ""
    echo "请检查后重试：./publish.sh"
fi
