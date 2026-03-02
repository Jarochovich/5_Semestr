const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');

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
    console.log('11-05c client connected\n');

    /* square(3), square(5,4), mul(3,5,7,9,11,13) */
    const s1 = await rpcCall('square', 3);
    const s2 = await rpcCall('square', 5, 4);
    const m1 = await rpcCall('mul', 3, 5, 7, 9, 11, 13);

    const sum1 = await rpcCall('sum', s1, s2, m1);

    /* fib(7) */
    const fibArr = await rpcCall('fib', 7);
    const fibSum = fibArr.reduce((a, b) => a + b, 0);

    /* mul(2,4,6) */
    const m2 = await rpcCall('mul', 2, 4, 6);

    /* итог */
    const result = sum1 + fibSum * m2;

    console.log('square(3) =', s1);
    console.log('square(5,4) =', s2);
    console.log('mul(3,5,7,9,11,13) =', m1);
    console.log('sum(...) =', sum1);

    console.log('fib(7) =', fibArr);
    console.log('sum(fib(7)) =', fibSum);
    console.log('mul(2,4,6) =', m2);

    console.log('\nИТОГОВЫЙ РЕЗУЛЬТАТ =', result);

    ws.close();
});
