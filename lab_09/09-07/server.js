const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let totalSize = 0;
        
        const writeStream = fs.createWriteStream('MyFile_Repeat.png');
        
        req.on('data', chunk => {
            writeStream.write(chunk);
            totalSize += chunk.length;
            console.log(`Получено: ${totalSize} байт`);
        });

        req.on('end', () => {
            writeStream.end();
            console.log(`Файл полностью получен!`);
            console.log(`Итоговый размер: ${totalSize} байт`);
            
            res.setHeader('Content-Type', 'text/plain');
            res.end(`Файл получен успешно!`);
        });
        
        req.on('error', (error) => {
            console.log('Ошибка при получении:', error.message);
            writeStream.destroy();
        });
        
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});