const http = require('http');
const fs = require('fs');

http.createServer((request, response) => {
     let image = fs.readFileSync('./Koshak.png');
    if (request.url !== '/png') {
        response.writeHead(404, {'content-type': 'text/plain, charset=utf8'});
        response.end('Not found');
    } else {
        response.writeHead(200, {'content-type': 'image/png, charset=utf8'});
        response.end(image); 
    }
})
.listen(3000, () => {
    console.log('Сервер прослушивается...')
});