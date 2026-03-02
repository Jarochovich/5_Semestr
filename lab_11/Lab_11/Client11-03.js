// 11-03-client.js
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4000');
ws.on('message', msg => console.log(msg.toString()));
