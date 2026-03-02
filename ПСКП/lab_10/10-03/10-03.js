const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000 });
const clients = [];
let clientCounter = 0;
let serverMessageCount = 0;

wss.on('connection', (ws) => {
    clientCounter++;
    const clientId = clientCounter;
    clients.push(ws);
    
    console.log(`Клиент ${clientId} подключен`);
    ws.send(`Сервер: Вы клиент №${clientId}`);
    
    ws.on('message', (data) => {
        const message = data.toString();
        console.log(`Клиент ${clientId}: ${message}`);
        
        // Отправка ответа всем клиентам
        serverMessageCount++;
        const response = `10-03-server: клиент${clientId}->${serverMessageCount}`;
        
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(response);
            }
        });
    });
    
    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index > -1) clients.splice(index, 1);
        console.log(`Клиент ${clientId} отключен`);
    });
});

console.log('Сервер запущен на порту 4000');