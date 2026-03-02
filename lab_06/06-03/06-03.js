const fs = require('fs');
const http = require('http');
const url = require('url');
const {parse} = require('querystring');
const {send} = require('./m0603awdos');

http.createServer((req, res) => {
    const html = fs.readFileSync('./index.html');

    if (url.parse(req.url).pathname === '/' && req.method === 'GET') {
        res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        res.end(html);
    } else if (url.parse(req.url).pathname === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', str => {body += str.toString();});
        req.on('end', async () => {
            try {
                let parm = parse(body);
                const messageText = parm.message || '';
                
                const result = await send(messageText);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Сообщение успешно отправлено',
                    to: result.to // Теперь result определен
                }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: false,
            error: 'Страница не найдена'
        }));
    }
})
.listen(5000, () => {
    console.log('Server running at http://localhost:5000/');
});