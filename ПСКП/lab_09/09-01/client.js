const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log('Статус ответа: ', res.statusCode);
    console.log('Сообщение к статусу ', res.statusMessage);
    console.log('IP-адрес удаленного сервера:', options.hostname);
    console.log('Порт удаленного сервера:', options.port);

    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Тело ответа: ', data);
    })
});

req.end();