// 11-01-client.js
const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
    const file = fs.readFileSync('test.txt');
    ws.send(JSON.stringify({
        filename: 'test.txt',
        content: file.toString('base64')
    }));
});
