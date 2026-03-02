// 11-06-server.js
const WebSocket = require('ws');
const readline = require('readline');

const PORT = 4000;
const wss = new WebSocket.Server({ port: PORT });

let clientsCount = 0;

console.log('==============================');
console.log('11-06 WS SERVER');
console.log('STATUS: STARTING...');
console.log('==============================');

/* обработка подключений */
wss.on('connection', ws => {
    clientsCount++;
    console.log(`[STATE] Client connected. Total: ${clientsCount}`);

    ws.on('close', () => {
        clientsCount--;
        console.log(`[STATE] Client disconnected. Total: ${clientsCount}`);
    });
});

/* stdin */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('[STATE] SERVER RUNNING');
console.log('[INFO] Type A, B or C and press Enter');

/* генерация событий */
rl.on('line', line => {
    const event = line.trim().toUpperCase();

    if (!['A', 'B', 'C'].includes(event)) {
        console.log('[WARN] Unknown event. Use A, B or C');
        return;
    }

    console.log(`[EVENT] ${event} generated → sent to ${clientsCount} client(s)`);

    wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(event);
        }
    });
});

