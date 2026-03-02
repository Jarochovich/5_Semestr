// 11-03-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });

let counter = 0;

setInterval(() => {
    counter++;
    wss.clients.forEach(ws => {
        if (ws.isAlive) ws.send(`11-03-server: ${counter}`);
    });
}, 15000);

setInterval(() => {
    let alive = 0;
    wss.clients.forEach(ws => {
        if (ws.isAlive) {
            alive++;
            ws.isAlive = false;
            ws.ping();
        }
    });
    console.log('Рабочих соединений:', alive);
}, 5000);

wss.on('connection', ws => {
    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);
});

console.log('11-03 server started');
