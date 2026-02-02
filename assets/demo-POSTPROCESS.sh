#!/bin/bash

# 🎬 demo.gif 后处理脚本
# 自动优化 GIF：压缩 + 尺寸校准 + 去抖动

set -e  # 遇到错误立即退出

echo "╔════════════════════════════════════════╗"
echo "║   🎬 GIF 优化脚本                      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 配置
INPUT="assets/demo.gif"
OUTPUT="assets/demo-optimized.gif"
FINAL="assets/demo.gif"

# 检查输入文件
if [ ! -f "$INPUT" ]; then
    echo "❌ 错误：找不到输入文件 $INPUT"
    echo ""
    echo "请先录制 GIF，或将录制的文件重命名为 assets/demo.gif"
    exit 1
fi

# 检查 gifsicle
if ! command -v gifsicle &> /dev/null; then
    echo "❌ 错误：未找到 gifsicle"
    echo ""
    echo "请先安装："
    echo "  brew install gifsicle"
    exit 1
fi

# 显示原始文件信息
ORIGINAL_SIZE=$(stat -f "%z" "$INPUT")
echo "📊 原始文件信息："
echo "   路径: $INPUT"
echo "   大小: $(numfmt --to=iec-i --suffix=B $ORIGINAL_SIZE 2>/dev/null || echo "$ORIGINAL_SIZE bytes")"
echo ""

# 优化 GIF
echo "🔧 正在优化 GIF..."
echo "   - 压缩级别: 3（最高）"
echo "   - 目标宽度: 1280px"
echo "   - 颜色数量: 256"
echo "   - 去抖动: 启用"
echo ""

gifsicle \
  --optimize=3 \
  --resize-width 1280 \
  --colors 256 \
  --dither \
  "$INPUT" -o "$OUTPUT"

# 检查优化结果
if [ ! -f "$OUTPUT" ]; then
    echo "❌ 优化失败"
    exit 1
fi

# 显示优化后文件信息
OPTIMIZED_SIZE=$(stat -f "%z" "$OUTPUT")
REDUCTION=$((100 - (OPTIMIZED_SIZE * 100 / ORIGINAL_SIZE)))

echo "✅ 优化完成！"
echo ""
echo "📊 优化后文件信息："
echo "   路径: $OUTPUT"
echo "   大小: $(numfmt --to=iec-i --suffix=B $OPTIMIZED_SIZE 2>/dev/null || echo "$OPTIMIZED_SIZE bytes")"
echo "   压缩率: ${REDUCTION}%"
echo ""

# 检查文件大小
MAX_SIZE=$((5 * 1024 * 1024))  # 5MB
if [ $OPTIMIZED_SIZE -gt $MAX_SIZE ]; then
    echo "⚠️  警告：文件大小超过 5MB"
    echo ""
    echo "建议进一步优化："
    echo "  1. 降低颜色数量："
    echo "     gifsicle -O3 --colors 128 $OUTPUT -o $OUTPUT"
    echo ""
    echo "  2. 降低分辨率："
    echo "     gifsicle -O3 --resize-width 960 $OUTPUT -o $OUTPUT"
    echo ""
    echo "  3. 减少帧数："
    echo "     gifsicle -O3 --delete '#0-1' $OUTPUT -o $OUTPUT"
    echo ""
else
    echo "✅ 文件大小符合要求（< 5MB）"
    echo ""
fi

# 询问是否替换原文件
read -p "是否替换原文件？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv "$OUTPUT" "$FINAL"
    echo "✅ 已替换原文件: $FINAL"
else
    echo "✅ 优化后的文件保存为: $OUTPUT"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🎉 完成！                            ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "下一步："
echo "  1. 查看 GIF: open $FINAL"
echo "  2. 更新 README.md（添加 GIF 引用）"
echo "  3. 提交到 Git: git add $FINAL && git commit -m 'docs: add demo gif'"
echo ""
