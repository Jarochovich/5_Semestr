// 11-02-server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const wss = new WebSocket.Server({ port: 4000 });
const DIR = path.join(__dirname, 'download');

wss.on('connection', ws => {
    ws.on('message', msg => {
        const filePath = path.join(DIR, msg.toString());
        const data = fs.readFileSync(filePath);
        ws.send(data);
    });
});

console.log('11-02 server started');
