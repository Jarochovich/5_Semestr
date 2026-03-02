const http = require('http');

const server = http.createServer((req, res) => {
    console.log('Получен запрос на:', req.url);
    
    if (req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);

        const x = urlParams.searchParams.get('x');
        const y = urlParams.searchParams.get('y');
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`Значение x: ${x}; значение y: ${y}`);
    } else {
        es.writeHead(400);
        res.end();
    }
    
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});