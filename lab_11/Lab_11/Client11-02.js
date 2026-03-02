// 11-02-client.js
const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => ws.send('file.txt'));
ws.on('message', data => fs.writeFileSync('received.txt', data));
