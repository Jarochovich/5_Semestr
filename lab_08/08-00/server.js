const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = 5000;
const STATIC_DIR = './static';

// Задание 01: /connection?set=set
function handleConnection(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const setParam = parsedUrl.query.set;
    
    if (setParam) {
        const newTimeout = parseInt(setParam);
        if (!isNaN(newTimeout) && newTimeout > 0) {
            server.keepAliveTimeout = newTimeout;
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            console.log(`Новое значение keepAliveTimeout = ${server.keepAliveTimeout}`);
            res.end(`<h1>Новое значение keepAliveTimeout = ${server.keepAliveTimeout}</h1>`);
        } else {
            res.statusCode = 400;
            res.end('Ошибка: параметр set должен быть положительным числом');
        }
    } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        console.log(`Значение keepAliveTimeout = ${server.keepAliveTimeout}`);
        res.end(`<h1>Значение keepAliveTimeout = ${server.keepAliveTimeout}</h1>`);
    }
}

// Задание 02: /headers
function handleHeaders(req, res) {
    let output = '<h1>Заголовки запроса:</h1><ul>';
    for (const [key, value] of Object.entries(req.headers)) {
        output += `<li><strong>${key}:</strong> ${value}</li>`;
    }
    output += '</ul>';
    
    res.setHeader('X-Awdos-Header', 'AwdosValue');
    res.setHeader('X-Server-Info', 'NodeJS-HTTP-Server');
    
    output += '<h1>Заголовки ответа:</h1><ul>';
    output += `<li><strong>X-Awdos-Header:</strong> AwdosValue</li>`;
    output += `<li><strong>X-Server-Info:</strong> NodeJS-HTTP-Server</li>`;
    output += '</ul>';
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(output);
}

// Задание 03: /parameter?x=x&&y=y
function handleParameterQuery(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const x = parsedUrl.query.x;
    const y = parsedUrl.query.y;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    if (x && y && !isNaN(x) && !isNaN(y)) {
        const numX = parseFloat(x);
        const numY = parseFloat(y);
        
        const sum = numX + numY;
        const diff = numX - numY;
        const product = numX * numY;
        const quotient = numY !== 0 ? numX / numY : 'Ошибка: деление на ноль';
        
        const result = `
            <h1>Результаты вычислений:</h1>
            <p>Сумма: ${numX} + ${numY} = ${sum}</p>
            <p>Разность: ${numX} - ${numY} = ${diff}</p>
            <p>Произведение: ${numX} * ${numY} = ${product}</p>
            <p>Частное: ${numX} / ${numY} = ${quotient}</p>
        `;
        res.end(result);
    } else {
        res.end('<h1>Ошибка: параметры x и y должны быть числами</h1>');
    }
}

// Задание 04: /parameter/x/y
function handleParameterPath(req, res) {
    const pathParts = req.url.split('/').filter(part => part);
    const x = pathParts[1];
    const y = pathParts[2];
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    if (x && y && !isNaN(x) && !isNaN(y)) {
        const numX = parseFloat(x);
        const numY = parseFloat(y);
        
        const sum = numX + numY;
        const diff = numX - numY;
        const product = numX * numY;
        const quotient = numY !== 0 ? numX / numY : 'Ошибка: деление на ноль';
        
        const result = `
            <h1>Результаты вычислений:</h1>
            <p>Сумма: ${numX} + ${numY} = ${sum}</p>
            <p>Разность: ${numX} - ${numY} = ${diff}</p>
            <p>Произведение: ${numX} * ${numY} = ${product}</p>
            <p>Частное: ${numX} / ${numY} = ${quotient}</p>
        `;
        res.end(result);
    } else {
        res.end(`<h1>URI: ${req.url}</h1>`);
    }
}

// Задание 05: /close
function handleClose(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Сервер будет остановлен через 10 секунд</h1>');
    
    setTimeout(() => {
        console.log('Сервер остановлен');
        process.exit(0);
    }, 10000);
}

// Задание 06: /socket
function handleSocket(req, res) {
    const clientIP = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const serverIP = req.socket.localAddress;
    const serverPort = req.socket.localPort;
    
    const result = `
        <h1>Информация о сокете:</h1>
        <p><strong>Клиент:</strong> ${clientIP}:${clientPort}</p>
        <p><strong>Сервер:</strong> ${serverIP}:${serverPort}</p>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(result);
}

// Задание 07: /req-data
function handleReqData(req, res) {
    let body = '';
    let chunkCount = 0;
    
    req.on('data', (chunk) => {
        chunkCount++;
        body += chunk;
        console.log(`Получен чанк ${chunkCount}, размер: ${chunk.length} байт`);
    });
    
    req.on('end', () => {
        const result = `
            <h1>Обработка запроса:</h1>
            <p>Получено чанков: ${chunkCount}</p>
            <p>Общий размер данных: ${body.length} байт</p>
            <p>Метод: ${req.method}</p>
            <p>Демонстрация порционной обработки завершена</p>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(result);
    });
}

// Задание 08: /resp-status?code=c&mess=m
function handleRespStatus(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const code = parseInt(parsedUrl.query.code) || 200;
    const mess = parsedUrl.query.mess || 'OK';
    
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Статус: ${code} - ${mess}`);
}

// Задание 09: /formparameter (GET/POST) - ЧТЕНИЕ ИЗ ФАЙЛА
function handleFormParameter(req, res) {
    if (req.method === 'GET') {
        // HTML форма из файла
        fs.readFile(path.join(STATIC_DIR, 'form.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Ошибка загрузки формы');
                return;
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(data);
        });
        return;
    }
    
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const params = querystring.parse(body);
        let output = '<h1>Полученные параметры:</h1><ul>';
        
        for (const [key, value] of Object.entries(params)) {
            output += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        output += '</ul>';
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(output);
    });
}


// Задание 10: /json (POST)
function handleJson(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const requestData = JSON.parse(body);
            console.log('Получен JSON:', requestData);
            
            // сумма x и y
            const x_plus_y = (requestData.x || 0) + (requestData.y || 0);
            
            // Конкатенация s и свойств объекта o
            const concatination_s_o = (requestData.s || '') + ': ' + 
                                   (requestData.o ? 
                                    `${requestData.o.surname || ''}, ${requestData.o.name || ''}` : '');
            
            // Длина массива m
            const Length_m = requestData.m ? requestData.m.length : 0;
            
            const responseData = {
                "__comment": "Ответ.Лабораторная работа 8/10",
                "x_plus_y": x_plus_y,
                "Concatination_s_o": concatination_s_o,
                "Length_m": Length_m
            };
            
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(responseData, null, 2));
            
        } catch (error) {
            console.error('Ошибка парсинга JSON:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON format' }));
        }
    });
}

// Задание 11: /xml (POST)
function handleXml(req, res) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            console.log('Получен XML:', body);
            
            // XML запрос
            const requestIdMatch = body.match(/id\s*=\s*["']([^"']*)["']/);
            const requestId = requestIdMatch ? requestIdMatch[1] : '';
            
            // Все элементы x
            const xMatches = body.match(/<x\s+value\s*=\s*["']([^"']*)["'][^>]*\/?>/g) || [];
            // Все элементы m
            const mMatches = body.match(/<m\s+value\s*=\s*["']([^"']*)["'][^>]*\/?>/g) || [];
            
            let sum = 0;
            let concatResult = '';
            
            // Сумма всех значений x
            xMatches.forEach(match => {
                const valueMatch = match.match(/value\s*=\s*["']([^"']*)["']/);
                if (valueMatch && valueMatch[1]) {
                    const num = parseFloat(valueMatch[1]);
                    if (!isNaN(num)) {
                        sum += num;
                    }
                }
            });
            
            // Конкатенация всех значений m
            mMatches.forEach(match => {
                const valueMatch = match.match(/value\s*=\s*["']([^"']*)["']/);
                if (valueMatch && valueMatch[1]) {
                    concatResult += valueMatch[1];
                }
            });
            
            // XML ответ
            const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                                    <response id="33" request="${requestId}">
                                        <sum element="x" result="${sum}"/>
                                        <concat element="m" result="${concatResult}"/>
                                    </response>`;
            
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.end(xmlResponse);
            
        } catch (error) {
            console.error('Ошибка обработки XML:', error);
            res.writeHead(400, { 'Content-Type': 'application/xml' });
            res.end('<?xml version="1.0"?><error>Invalid XML format</error>');
        }
    });
}

// Задание 12: /files
function handleFiles(req, res) {
    fs.readdir(STATIC_DIR, (err, files) => {
        if (err) {
            res.writeHead(500);
            res.end('Ошибка чтения директории');
            return;
        }
        
        const fileCount = files.length;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ 
            message: `Количество файлов в директории static: ${fileCount}`,
            files: files 
        }));
    });
}

// Задание 13: /files/filename
function handleFileDownload(req, res) {
    const filename = req.url.split('/').pop();
    const filePath = path.join(STATIC_DIR, filename);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404);
            res.end('Файл не найден');
            return;
        }
        
        const fileStream = fs.createReadStream(filePath);
        const mimeType = getMimeType(filename);
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        fileStream.pipe(res);
    });
}

// Задание 14: /upload
function handleUpload(req, res) {
    // Обработка GET-запроса - отправка web-формы из файла
    if (req.method === 'GET') {
        fs.readFile(path.join(STATIC_DIR, 'upload.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Ошибка загрузки формы');
                return;
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(data);
        });
        return;
    }
    
    // сохранение файла в директории static
    if (req.method === 'POST') {
        let body = [];
        
        req.on('data', chunk => {
            body.push(chunk);
        });
        
        req.on('end', () => {
            const data = Buffer.concat(body);
            
            // Проверяем Content-Type
            if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
                res.writeHead(400);
                res.end('Ошибка: ожидается multipart/form-data');
                return;
            }
            
            const boundary = req.headers['content-type'].split('boundary=')[1];
            const parts = data.toString().split(`--${boundary}`);
            
            let fileSaved = false;
            
            for (const part of parts) {
                if (part.includes('filename="') && part.includes('Content-Type:')) {
                    const filenameMatch = part.match(/filename="([^"]*)"/);
                    if (filenameMatch) {
                        const filename = filenameMatch[1];
                        
                        // содержимое файла
                        const fileContentStart = part.indexOf('\r\n\r\n') + 4;
                        const fileContentEnd = part.lastIndexOf('\r\n');
                        const fileContent = part.substring(fileContentStart, fileContentEnd);
                        
                        // Сохраняем файл в директории static
                        const filePath = path.join(STATIC_DIR, filename);
                        
                        fs.writeFile(filePath, fileContent, (err) => {
                            if (err) {
                                console.error('Ошибка сохранения файла:', err);
                                res.writeHead(500);
                                res.end('Ошибка сохранения файла на сервере');
                                return;
                            }
                            
                            // сохранение
                            res.setHeader('Content-Type', 'text/html; charset=utf-8');
                            res.end(`
                                <h1>Загрузка завершена</h1>
                                <p>Файл "${filename}" успешно загружен в папку static!</p>`);
                        });
                        fileSaved = true;
                        break;
                    }
                }
            }
            
            if (!fileSaved) {
                res.writeHead(400);
                res.end('Файл не найден в запросе');
            }
        });
        
        req.on('error', (err) => {
            console.error('Ошибка при получении данных:', err);
            res.writeHead(500);
            res.end('Ошибка при обработке запроса');
        });
    }
}

// Определения MIME типа
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// обработчик запросов
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;


    // маршрутизация
    if (pathname === '/connection') {
        handleConnection(req, res);
    } else if (pathname === '/headers') {
        handleHeaders(req, res);
    } else if (pathname.startsWith('/parameter?') || pathname === '/parameter') {
        handleParameterQuery(req, res);
    } else if (pathname.startsWith('/parameter/')) {
        handleParameterPath(req, res);
    } else if (pathname === '/close') {
        handleClose(req, res);
    } else if (pathname === '/socket') {
        handleSocket(req, res);
    } else if (pathname === '/req-data') {
        handleReqData(req, res);
    } else if (pathname === '/resp-status') {
        handleRespStatus(req, res);
    } else if (pathname === '/formparameter') {
        handleFormParameter(req, res);
    } else if (pathname === '/json') {
        handleJson(req, res);
    } else if (pathname === '/xml') {
        handleXml(req, res);
    } else if (pathname === '/files' && !pathname.includes('/files/')) {
        handleFiles(req, res);
    } else if (pathname.startsWith('/files/')) {
        handleFileDownload(req, res);
    } else if (pathname === '/upload') {
        handleUpload(req, res);
    } else {
        res.writeHead(404);
        res.end('Страница не найдена');
    }
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступные endpoints:`);
    console.log(`  GET  /connection?set=value`);
    console.log(`  GET  /headers`);
    console.log(`  GET  /parameter?x=num&y=num`);
    console.log(`  GET  /parameter/x/y`);
    console.log(`  GET  /close`);
    console.log(`  GET  /socket`);
    console.log(`  GET  /req-data`);
    console.log(`  GET  /resp-status?code=num&mess=text`);
    console.log(`  GET/POST /formparameter`);
    console.log(`  POST /json`);
    console.log(`  POST /xml`);
    console.log(`  GET  /files`);
    console.log(`  GET  /files/filename`);
    console.log(`  GET/POST /upload`);
});