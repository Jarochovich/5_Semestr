// 11-04-client.js
const WebSocket = require('ws');
const name = process.argv[2];

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
    ws.send(JSON.stringify({
        client: name,
        timestamp: Date.now()
    }));
});

ws.on('message', msg => console.log(msg.toString()));
