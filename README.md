# 作业小管家 - Web 版

AI 智能作业批改助手，支持语数英三科。

## 🚀 部署到 Vercel

### 1. 准备工作

- 注册 Vercel 账号：https://vercel.com
- 安装 Vercel CLI：
  ```bash
  npm i -g vercel
  ```

### 2. 配置环境变量

在项目目录下创建 `.env` 文件：
```
KIMI_API_KEY=你的Kimi API密钥
```

或者在 Vercel 控制台设置环境变量：
- 进入项目 → Settings → Environment Variables
- 添加 `KIMI_API_KEY`

### 3. 部署

```bash
# 登录 Vercel
vercel login

# 部署
vercel --prod
```

### 4. 获取域名

部署完成后，Vercel 会自动分配域名：
```
https://homework-grader-xxxxx.vercel.app
```

你也可以绑定自己的域名：
- 进入项目 → Settings → Domains
- 添加自定义域名

## 📝 使用说明

1. 打开网页
2. 点击上传作业照片
3. 选择科目（数学/语文/英语）
4. 点击"开始批改"
5. 查看 AI 批改结果

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 本地运行
vercel dev
```

访问 http://localhost:3000

## 📁 文件结构

```
.
├── index.html          # 前端页面
├── api/
│   └── grade.js        # 批改 API
├── package.json
├── vercel.json         # Vercel 配置
└── README.md
```

## 🎯 功能特性

- ✅ 拍照上传作业
- ✅ AI 自动识别批改
- ✅ 数学：判对错 + 详细解题步骤
- ✅ 语文：作文评分 + 修改建议
- ✅ 英语：语法纠错 + 润色版本
- ✅ 响应式设计，支持手机/平板/电脑

## ⚠️ 注意事项

1. 需要 Kimi API Key 才能正常使用
2. 图片建议控制在 5MB 以内
3. 批改结果仅供参考，重要作业请人工复核
