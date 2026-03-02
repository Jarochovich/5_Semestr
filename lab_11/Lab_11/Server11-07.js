// 11-07-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });

wss.on('connection', ws => {
    ws.on('message', msg => console.log('Уведомление:', msg.toString()));
});
