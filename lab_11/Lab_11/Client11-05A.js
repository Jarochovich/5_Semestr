// 11-05-client.js
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4000');

function call(method, ...params) {
    return new Promise(res => {
        ws.once('message', m => res(m.toString()));
        ws.send(JSON.stringify({ method, params }));
    });
}

ws.on('open', async () => {
    console.log(await call('square', 3));
    console.log(await call('sum', 2,4,6,8,10));
});
