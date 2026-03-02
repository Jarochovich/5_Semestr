const fs = require('fs');
const http = require('http');
const url = require('url');
const {parse} = require('querystring');
const {send} = require('./node_modules/m0603yarok/m0603yarok'); // вот оно мое творение
// const { send } = require('C:/Users/yarok/AppData/Roaming/npm/node_modules/m0603yarok'); // можно и так
const emailConfig = require('./email');

// Проверяем конфигурацию
if (!emailConfig.auth || !emailConfig.auth.user || !emailConfig.auth.pass) {
    console.error(' Ошибка: Неправильная конфигурация email');
    console.error('  Проверьте файл config/email.js');
    process.exit(1);
}


http.createServer((req, res) => {
    const html = fs.readFileSync('./index.html');

    if (url.parse(req.url).pathname === '/' && req.method === 'GET') {
        res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
        res.end(html);
    } else if (url.parse(req.url).pathname === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', str => { body += str.toString(); });
        req.on('end', async () => {
            try {
                let parm = parse(body);
                const messageText = parm.message || '';
                
                // Используем пакет с передачей конфигурации
                const result = await send(messageText, emailConfig);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Сообщение успешно отправлено!',
                    to: result.to,
                    from: result.from,
                    package: result.package,
                    version: result.version
                }));
            } catch (error) {
                console.error(' Ошибка в приложении:', error.message);
                
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