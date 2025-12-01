#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURI(req.url.split('?')[0]);
    let filePath = path.join(ROOT_DIR, urlPath === '/' ? 'index.html' : urlPath);

    // 安全检查，防止目录遍历攻击
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }

        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`🎮 LUMIN城堡游戏服务器已启动!`);
    console.log(`📂 服务目录: ${ROOT_DIR}`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`🛑 按 Ctrl+C 停止服务器`);
    console.log('');
});

// 处理 Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 感谢游玩 LUMIN城堡!');
    process.exit(0);
});