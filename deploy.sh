#!/bin/bash

# 作业小管家部署脚本
# 一键部署到 Vercel

echo "🚀 开始部署作业小管家..."

# 检查 vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 登录 Vercel
echo "🔑 请登录 Vercel..."
vercel login

# 部署
echo "📤 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "📝 请记得在 Vercel 控制台设置环境变量："
echo "   KIMI_API_KEY=你的API密钥"
echo ""
echo "🔗 部署后访问链接查看你的作业小管家！"
