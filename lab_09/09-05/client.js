const http = require('http');

const xmlData = `<?xml version="1.0"?>
<request id="28">
    <x value="7"/>
    <x value="15"/>
    <m value="Awdos"/>
    <m value="Test"/>
</request>`;


const options = {
    hostname: 'localhost',
    port: 5000,
    method: 'POST',
    headers: {
        'Content-Type': 'text/xml'
    }
};

const req = http.request(options, (res) => {
    console.log('Статус ответа: ', res.statusCode);
    console.log('Сообщение к статусу ', res.statusMessage);
    console.log('IP-адрес удаленного сервера:', options.hostname);
    console.log('Порт удаленного сервера:', options.port);
    
    let responseData = '';
    res.on('data', chunk => {
        responseData += chunk.toString();
    });

    res.on('end', () => {
        console.log('Тело ответа:', responseData);
    });
});

req.write(xmlData);
req.end();