const http = require("http");
const fs = require("fs");

http.createServer( (request, response) => {

    if(request.url === '/fetch')
    {
        const file = fs.readFileSync('./fetch.html');

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(file);
    }
    else if (request.url === '/api/name')
    { 
        response.writeHead(200, {'Content-Type': 'aplication/json'});
        response.end('Ярохович Станислав Александрович');
    }
    else
    {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Not Found!');
    }
}).listen(3000, () =>
    {
        console.log('Сервер прослушивается...');
    });

