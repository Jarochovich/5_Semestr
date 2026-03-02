const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            console.log('Получены данные файла:', body);
            
            fs.writeFileSync('MyFile_Repeat.txt', body);
            
            res.setHeader('Content-Type', 'text/plain');
            res.end('Файл успешно получен и сохранен');
        });
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});