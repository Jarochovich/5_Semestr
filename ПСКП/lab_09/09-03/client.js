const http = require('http');
const query = require('querystring');

const x = 7;
const y = 15;
const s = 'Awdos';

const postData = query.stringify({x: x, y: y, s: s});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/`,
    method: 'POST',
};

const req = http.request(options, (res) => {
    console.log('Статус ответа: ', res.statusCode);
    console.log('Сообщение к статусу ', res.statusMessage);
    console.log('IP-адрес удаленного сервера:', options.hostname);
    console.log('Порт удаленного сервера:', options.port);

    let data = '';
    res.on('data', chunk => {
        data += chunk.toString();
    });

    res.on('end', () => {
        console.log('Тело ответа: ', data);
    })
});

req.write(postData);
req.end();