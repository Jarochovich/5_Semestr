const http = require('http');

const server = http.createServer((req, res) => {

    if (req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {

            const idStart = body.indexOf('id="') + 4;
            const idEnd = body.indexOf('"', idStart);
            const requestId = body.substring(idStart, idEnd);
            
            let sum = 0;
            let pos = 0;
            while ((pos = body.indexOf('<x value="', pos)) !== -1) {
                const start = pos + 10;
                const end = body.indexOf('"', start);
                const value = body.substring(start, end);
                sum += Number(value);
                pos = end;
            }
            
            let concatResult = '';
            pos = 0;
            while ((pos = body.indexOf('<m value="', pos)) !== -1) {
                const start = pos + 10;
                const end = body.indexOf('"', start);
                const value = body.substring(start, end);
                concatResult += value;
                pos = end;
            }
            
            const xmlResponse = `<?xml version="1.0"?>
                <response id="33" request="${requestId}">
                    <sum element="x" result="${sum}"/>
                    <concat element="m" result="${concatResult}"/>
                </response>`;
            
            res.setHeader('Content-Type', 'text/xml');
            res.end(xmlResponse);
        });
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});