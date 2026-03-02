const http = require('http');
const fs = require('fs');

// как бинарные данные; можно и заголовок 
const fileData = fs.readFileSync('MyFile.png');

const options = {
    hostname: 'localhost',
    port: 5000,
    method: 'POST',
    headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileData.length
    }
};

const fileSizeMB = (fileData.length / 1024 / 1024).toFixed(2);
console.log(`Отправка файла размером ${fileData.length} байт (${fileSizeMB} МБ)`);

const req = http.request(options, (res) => {
    console.log('Статус ответа:', res.statusCode);
    
    let responseData = '';
    res.on('data', chunk => {
        responseData += chunk.toString();
    });

    res.on('end', () => {
        console.log('Ответ сервера:', responseData);
    });
});


console.log('Начало отправки...');
req.write(fileData);
req.end();
console.log('Файл отправлен на сервер!');