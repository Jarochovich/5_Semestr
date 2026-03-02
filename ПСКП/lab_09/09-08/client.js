const http = require('http');
const fs = require('fs');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
};

console.log('Отправка GET запроса для получения файла...');

const req = http.request(options, (res) => {
    console.log('Статус ответа:', res.statusCode);
    console.log('Размер файла:', res.headers['content-length'], 'байт');
    console.log('Тип файла:', res.headers['content-type']);
    
    let receivedData = [];
    let totalReceived = 0;
    
    res.on('data', chunk => {
        receivedData.push(chunk);
        totalReceived += chunk.length;
        console.log(`Получено: ${totalReceived} байт`);
    });
    
    res.on('end', () => {
        console.log('Файл полностью получен!');
        
        // Сохраняем файл
        const fileBuffer = Buffer.concat(receivedData);
        fs.writeFileSync('downloaded_file.png', fileBuffer);
        
        console.log(`Файл сохранен как downloaded_file.png`);
        console.log(`Итоговый размер: ${fileBuffer.length} байт`);
    });
});

req.on('error', (error) => {
    console.log('Ошибка:', error.message);
});

req.end();