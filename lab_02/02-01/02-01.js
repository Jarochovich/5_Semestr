const http = require("http");
const fs = require("fs");

http.createServer((request, response) => {
    const html = fs.readFileSync('./index.html');
    response.writeHead(200, {'content-type': 'text/html; charset=utf8'});
    response.end(html);
})
.listen(3000, () => {
    console.log('Сервер прослушивается...');
});