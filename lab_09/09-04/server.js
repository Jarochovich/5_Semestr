const http = require('http');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const requestData = JSON.parse(body);
            
            const x_plus_y = requestData.x + requestData.y;
            const Concatination_s_o = requestData.s + ': ' + requestData.o.surname + ', ' + requestData.o.name;
            const Length_m = requestData.m.length;
            
            const responseData = {
                "__comment": "Ответ.Лабораторная работа 8/10",
                "x_plus_y": x_plus_y,
                "Concatination_s_o": Concatination_s_o,
                "Length_m": Length_m
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responseData));
        });
    } else {
        res.writeHead(400);
        res.end();
    }
});

server.listen(5000, () => {
    console.log('Сервер запущен на http://localhost:5000');
});