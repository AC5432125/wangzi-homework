// 简易服务器 - 用于本地测试和API转发
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif'
};

const server = http.createServer((req, res) => {
    // CORS 设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API 路由
    if (req.url === '/api/grade' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // 这里应该调用AI API进行批改
                // 目前返回模拟数据
                const result = {
                    score: Math.floor(Math.random() * 20) + 80,
                    errors: [
                        { type: '计算错误', reason: '步骤正确但结果算错', question: '第3题' },
                        { type: '概念模糊', reason: '公式记错', question: '第5题' }
                    ],
                    advice: '计算需要更仔细，建议多练习同类题型'
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
        return;
    }
    
    if (req.url === '/api/practice' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // 生成练习题（模拟）
                const questions = [];
                for (let i = 1; i <= (data.count || 5); i++) {
                    questions.push({
                        num: i,
                        content: `这是第${i}道${data.subject}练习题...`,
                        answer: '答案略'
                    });
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ questions }));
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
        return;
    }
    
    // 静态文件服务
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});