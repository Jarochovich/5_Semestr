const WebSocket = require('ws');

// Все переменные состояния
const state = {
    ws: null,
    messageCount: 0,
    sendInterval: null,
    stopTimeout: null,
    isRunning: false
};

function logMessage(text) {
    console.log(`[${new Date().toLocaleTimeString()}] ${text}`);
}

function start() {
    if (state.isRunning) {
        logMessage('WebSocket клиент уже запущен!');
        return;
    }

    state.messageCount = 0;
    state.isRunning = true;
    
    state.ws = new WebSocket('ws://localhost:4000');
    
    state.ws.on('open', () => {
        logMessage('WebSocket соединение установлено');
        
        state.sendInterval = setInterval(() => {
            if (state.ws.readyState === WebSocket.OPEN) {
                state.messageCount++;
                const message = `10-02-client: ${state.messageCount}`;
                state.ws.send(message);
                logMessage(`Отправлено: ${message}`);
            }
        }, 3000);
        
        state.stopTimeout = setTimeout(() => {
            stop();
        }, 25000);
    });
    
    state.ws.on('message', (data) => {
        logMessage(`Получено: ${data}`);
    });
    
    state.ws.on('close', () => {
        logMessage('WebSocket соединение закрыто');
        cleanup();
    });
    
    state.ws.on('error', (error) => {
        logMessage(`WebSocket ошибка: ${error}`);
        cleanup();
    });
}

function stop() {
    if (state.ws) {
        state.ws.close();
    }
    cleanup();
}

function cleanup() {
    if (state.sendInterval) clearInterval(state.sendInterval);
    if (state.stopTimeout) clearTimeout(state.stopTimeout);
    state.sendInterval = null;
    state.stopTimeout = null;
    state.isRunning = false;
}

start();