const http = require("http");
const url = require('url');
const fs = require('fs');


function factAsyncWithImmediate(n) {
    return new Promise((resolve) => {
        if (n === 0 || n === 1) {
            setImmediate(() => resolve(1));
        } else {
            setImmediate(async () => {
                const result = await factAsyncWithImmediate(n - 1);
                resolve(n * result);
            });
        }
    });
}

http.createServer((request, response) => {

    let rc = JSON.stringify({ k: 0});
    if (url.parse(request.url).pathname === '/fact') {
        console.log(request.url);
        if (typeof url.parse(request.url, true).query.k != 'undefined') {
            let k = parseInt(url.parse(request.url, true).query.k);
            if (Number.isInteger(k) && k >= 0) {
                 factAsyncWithImmediate(k)
                    .then(factorialResult => {
                        response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                        response.end(JSON.stringify({ 
                            k: k, 
                            fact: factorialResult 
                        }));
                        console.log(`Response for k=${k}: ${factorialResult}`);
                    })
                    .catch(error => {
                        response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        response.end(JSON.stringify({ error: 'Internal server error' }));
                    });
            }
            else {
                response.writeHead(400, { 'Content-Type': 'text/html charset=utf-8' });
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
