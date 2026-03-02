const http = require('http');
const query = require('querystring');

const server = http.createServer((req, res) => {
    console.log('Получен запрос на:', req.url);

    if (req.method === 'POST') {
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        })

        req.on('end', () => {
            const params = query.parse(body);

            const x = params.x;
            const y = params.y;
            const s = params.s;

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');

            res.end(`POST: x = ${x}; y = ${y}; s = ${s}`);
        });
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});