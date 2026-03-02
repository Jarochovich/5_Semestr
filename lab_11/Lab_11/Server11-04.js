// 11-04-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });
let n = 0;

wss.on('connection', ws => {
    ws.on('message', msg => {
        const { client, timestamp } = JSON.parse(msg);
        n++;
        ws.send(JSON.stringify({
            server: n,
            client,
            timestamp
        }));
    });
});

console.log('11-04 server started');
