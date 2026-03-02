const http = require("http");
const fs = require("fs");

http.createServer( (request,response) => {

    if(request.url === '/xmlhttprequest')
    {
        const file = fs.readFileSync('./xmlhttprequest.html');

        response.writeHead(200, {'Content-Type':'text/html'});
        response.end(file);
    }
    else if (request.url === '/api/name')
    { 
        response.writeHead(200,{'Content-Type': 'aplication/json'});
        response.end(JSON.stringify({
            surname: 'Ярохович',
            name: 'Станислав',
            patronymic: 'Александрович'
        }));
    }
    else
    {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Not Found!');
    }
}).listen(5000, '127.0.0.1', () =>
    {
        console.log('Сервер прослушивается...');
    });

