const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        console.log('Получен GET запрос на файл');
        
        const filePath = path.join(__dirname, 'MyFile.png');
        
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath);
            const fileSize = fileData.length;
            
            res.setHeader('Content-Type', 'application/png');
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', 'attachment; filename="downloaded_file.png"');
            
            res.end(fileData);
            console.log(`Файл размером ${fileSize} байт отправлен`);
            
        } else {
            res.statusCode = 404;
            res.end('Файл не найден на сервере');
        }
        
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});