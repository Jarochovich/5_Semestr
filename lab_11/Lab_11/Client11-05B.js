const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');

/* универсальный RPC-вызов */
function rpcCall(method, ...params) {
    return new Promise(resolve => {
        ws.once('message', msg => {
            resolve(JSON.parse(msg.toString()));
        });
        ws.send(JSON.stringify({
            method,
            params
        }));
    });
}

ws.on('open', async () => {
    console.log('11-05b client connected\n');

    /* параллельные вызовы */
    const results = await Promise.all([
        rpcCall('square', 3),
        rpcCall('square', 5, 4),

        rpcCall('sum', 2),
        rpcCall('sum', 2, 4, 6, 8, 10),

        rpcCall('mul', 3),
        rpcCall('mul', 3, 5, 7, 9, 11, 13),

        rpcCall('fib', 1),
        rpcCall('fib', 2),
        rpcCall('fib', 7),

        rpcCall('fact', 0),
        rpcCall('fact', 5),
        rpcCall('fact', 10)
    ]);

    console.log('Результаты RPC-вызовов:');
    results.forEach(r => console.log(r));

    ws.close();
});
