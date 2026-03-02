const http = require('http');

const server = http.createServer((req, res) => {
    console.log('Получен запрос на:', req.url);
    
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Лови текст');
    } else {
        res.writeHead(400);
        res.end();
    }

});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});





// const http = require('http');
// const fs = require('fs');

// const server = http.createServer((req, res) => {
//     let reqInfo = '';
//     res.setHeader('Content-Type', 'text/html; charset=utf-8');

//     reqInfo += `<ul>`;
//     for (const [key, value] of Object.entries(req.headers)) {
//         reqInfo += `<li>${key} ${value}</li>`;
//     }
//     reqInfo += `</ul>`;

//     res.end(reqInfo);

// }).listen(5000, () => {
//     console.log('Сервер запущен на порту 5000');
// }) ;