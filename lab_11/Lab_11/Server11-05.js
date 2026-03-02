// 11-05-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });

const rpc = {
    square: (...a) => a.length === 1 ? Math.PI * a[0] ** 2 : a[0] * a[1],
    sum: (...a) => a.reduce((s, x) => s + x, 0),
    mul: (...a) => a.reduce((s, x) => s * x, 1),
    fib: n => Array.from({ length: n }, (_, i) =>
        i < 2 ? i : null).reduce((a, _, i) => {
            if (i >= 2) a[i] = a[i - 1] + a[i - 2];
            return a;
        }, [0, 1]).slice(0, n),
    fact: n => n <= 1 ? 1 : n * rpc.fact(n - 1)
};

wss.on('connection', ws => {
    ws.on('message', msg => {
        const { method, params } = JSON.parse(msg);
        ws.send(JSON.stringify(rpc[method](...params)));
    });
});

console.log('11-05 server started');
