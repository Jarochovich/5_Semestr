// 11-07-client.js
const WebSocket = require('ws');
const readline = require('readline');

const ws = new WebSocket('ws://localhost:4000');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', line => ws.send(line));
