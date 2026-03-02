const http = require("http");
const url = require('url');
const fs = require('fs');

let fact = (n) => { 
    if (n === 0 || n === 1) return 1;
    return n * fact(n - 1);
}

http.createServer((request, response) => {

    let rc = JSON.stringify({ k: 0});
    if (url.parse(request.url).pathname === '/fact') {
        console.log(request.url);
        if (typeof url.parse(request.url, true).query.k != 'undefined') {
            let k = parseInt(url.parse(request.url, true).query.k);
            if (Number.isInteger(k) && k >= 0) {
                response.writeHead(200, {'content-type': 'application/json; charset=utf-8'} );
                response.end(JSON.stringify({ k: k, fact: fact(k) }));
            }
            else {
                response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                response.end(JSON.stringify({ error: 'Неправильное значение' }));
            }
        }
    }
    else if (url.parse(request.url).pathname === '/') {
        let html = fs.readFileSync('./index.html');
        response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        response.end(html);
    }
    else {
        response.end(rc);
    }

}).listen(5000);
