const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');


const httpSever = http.createServer((req, res) => {

    if (req.method == "GET" && req.url == '/start') {
        res.writeHead(200, {'Content-type': 'text/html; charset=utf-8'});
        res.end(fs.readFileSync('./index.html'));
    } else {
        res.writeHead(400, {'Content-type': 'text/html; charset=utf-8'});
        res.end();
    }

}).listen(3000, () => {
    console.log("HTTP сервер прослушивается на 3000 порту");
})


const wsserver = new WebSocket.Server({port: 4000, host: 'localhost'}, () => {
     console.log("WebSocket сервер прослушивается на 4000 порту");
});

wsserver.on('connection', (ws) => {
    let clientMessageCount = 0;
    let serverMessageCount = 0;
    let intervalId;

    console.log('Соединение открыто');

    ws.on('message', (message) => {
        const messageStr = message.toString();
        console.log(`Получено от клиента: ${messageStr}`);

        const messageArr = messageStr.split(' ');
        clientMessageCount = +messageArr[1];

        if(!intervalId) {
            intervalId = setInterval(() => {
                serverMessageCount++;

                if (ws.readyState === WebSocket.OPEN) {
                    const responseMessage = `10-01-server: ${clientMessageCount}->${serverMessageCount}`;
                    ws.send(responseMessage);
                } else {
                    clearInterval(intervalId);
                } 
            }, 5000);
        }

    });

    ws.on('close', () => {
        console.log('Соединение закрыто');
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    ws.on('error', (err) => {
        console.log('Ошибка:', err);
        if (intervalId) {
            clearInterval(intervalId);
        }
    });
});
