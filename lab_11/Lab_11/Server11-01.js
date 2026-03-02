// 11-01-server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const wss = new WebSocket.Server({ port: 4000 });
const UPLOAD_DIR = path.join(__dirname, 'upload');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

wss.on('connection', ws => {
    ws.on('message', data => {
        const msg = JSON.parse(data);
        const filePath = path.join(UPLOAD_DIR, msg.filename);
        fs.writeFileSync(filePath, Buffer.from(msg.content, 'base64'));
        console.log(`Файл ${msg.filename} принят`);
    });
});

console.log('11-01 WS server on port 4000');
