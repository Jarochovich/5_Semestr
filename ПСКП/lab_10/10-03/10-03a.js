const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');
let messageCount = 0;
let intervalId = null;
let timeoutId = null;

ws.on('open', () => {
    console.log('Подключение установлено');
    
    intervalId = setInterval(() => {
        messageCount++;
        const message = `10-03a-client: ${messageCount}`;
        ws.send(message);
        console.log(`Отправлено: ${message}`);
    }, 3000);

    timeoutId = setTimeout(() => {
        stop();
    }, 25000);
});

ws.on('message', (data) => {
    console.log(`Получено: ${data}`);
});


function stop() {
    if (ws) ws.close();
    console.log(`Окончание работы клиента`);
    cleanup();
}

ws.on("close", () => {
    cleanup()
});

function cleanup() {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);

    messageCount = 0;
    intervalId = null;
    timeoutId = null;
}