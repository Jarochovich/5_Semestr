const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const data = require('./database');

const db = new data.DB();

// управление сервером
let serverStopTimer = null;
let commitInterval = null;
let statsInterval = null;

let statistics = {
    start: null,
    finish: null,
    requestCount: 0,
    commitCount: 0,
    isCollecting: false
};

// -------------------------------------------

function sendJSON(res, statusCode, obj) {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify(obj));
}

function sendHTML(res, statusCode, html) {
    res.writeHead(statusCode, { 
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(html);
}

function readHTMLFile() {
    return new Promise((resolve, reject) => {
        const htmlPath = path.join(__dirname, 'index.html');
        fs.readFile(htmlPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', str => body += str.toString());
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

async function commit() {
    return new Promise((resolve) => {
        console.log('COMMIT executed');
        // имитация выполнения
        setTimeout(() => {
            db.emit('COMMIT');
            statistics.commitCount++;
            resolve();
        }, 100);
    });
}

// обработка команд
function setupCommandHandling(server) {
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (data) => {
        const input = data.trim();
        const parts = input.split(' ');
        const command = parts[0];
        const param = parts[1];
        
        switch(command) {
            case 'sd':
                // остановка сервера
                if (serverStopTimer) {
                    clearTimeout(serverStopTimer);
                    serverStopTimer = null;
                    console.log('Previous server stop cancelled');
                }
                
                if (param !== undefined) {
                    const seconds = parseInt(param);
                    if (!isNaN(seconds) && seconds > 0) {
                        serverStopTimer = setTimeout(() => {
                            console.log(`Server stopping after ${seconds} seconds`);
                            server.close(() => {
                                console.log('Server stopped');
                                process.exit(0);
                            });
                        }, seconds * 1000);
                        console.log(`Server will stop in ${seconds} seconds`);
                    }
                } else {
                    console.log('Server stop cancelled');
                }
                break;
                
            case 'sc':
                // периодическая фиксация
                if (commitInterval) {
                    clearInterval(commitInterval);
                    commitInterval = null;
                    console.log('Periodic commit stopped');
                }
                
                if (param !== undefined) {
                    const seconds = parseInt(param);
                    if (!isNaN(seconds) && seconds > 0) {
                        commitInterval = setInterval(() => {
                            commit();
                        }, seconds * 1000);
                        commitInterval.unref(); // Не препятствует остановке сервера
                        console.log(`Periodic commit started every ${seconds} seconds`);
                    }
                } else {
                    console.log('Periodic commit stopped');
                }
                break;
                
            case 'ss':
                // cбор статистики
                if (statsInterval) {
                    clearInterval(statsInterval);
                    statsInterval = null;
                    statistics.isCollecting = false;
                    statistics.finish = new Date().toISOString();
                    console.log('Statistics collection stopped');
                }
                
                if (param !== undefined) {
                    const seconds = parseInt(param);
                    if (!isNaN(seconds) && seconds > 0) {
                        // cброс статистики
                        statistics = {
                            start: new Date().toISOString(),
                            finish: null,
                            requestCount: 0,
                            commitCount: 0,
                            isCollecting: true
                        };
                        
                        statsInterval = setTimeout(() => {
                            statistics.isCollecting = false;
                            statistics.finish = new Date().toISOString();
                            statsInterval = null;
                            console.log('Statistics collection finished automatically');
                        }, seconds * 1000);
                        statsInterval.unref();
                        console.log(`Statistics collection started for ${seconds} seconds`);
                    }
                } else {
                    console.log('Statistics collection stopped');
                }
                break;
                
            default:
                console.log('Unknown command:', command);
        }
    });
}

// ---------------------------------------------

// обработчики событий
db.on('GET', async (req, res) => {
    try {
        statistics.requestCount++;
        
        const rows = await db.select();
        sendJSON(res, 200, rows);
    } catch (error) {
        console.error(error);
        sendJSON(res, 500, { error: 'Internal server error' });
    }
});

db.on('POST', async (req, res) => {
    try {
        statistics.requestCount++;
        
        const body = await parseBody(req);
        const row = await JSON.parse(body);
        const newRow = await db.insert(row);
        sendJSON(res, 200, newRow);
    } catch (error) {
        if (error instanceof SyntaxError) {
            sendJSON(res, 400, { error: 'Invalid JSON' });
        } else if (error instanceof Error) {
            sendJSON(res, 400, { error: error.message });
        } else {
            console.error(error);
            sendJSON(res, 500, { error: 'Internal server error' });
        }
    }
});

db.on('PUT', async (req, res, id = null) => {
    try {
        statistics.requestCount++;
        
        const body = await parseBody(req);
        const rowData = await JSON.parse(body);
        
        if (id !== null) {
            rowData.id = id;
        }
        
        const updatedRow = await db.update(rowData);
        sendJSON(res, 200, updatedRow);
    } catch (error) {
        if (error instanceof SyntaxError) {
            sendJSON(res, 400, { error: 'Invalid JSON' });
        } else if (error instanceof Error) {
            sendJSON(res, 400, { error: error.message });
        } else {
            console.error(error);
            sendJSON(res, 500, { error: 'Internal server error' });
        }
    }
});

db.on('DELETE', async (req, res, id = null) => {
    try {
        statistics.requestCount++;
        
        if (id === null) {
            const parsedUrl = url.parse(req.url, true);
            id = parseInt(parsedUrl.query.id);
        }

        if (isNaN(id)) {
            sendJSON(res, 400, { error: 'Invalid ID' });
            return;
        }

        const deletedRow = await db.delete(id);
        sendJSON(res, 200, deletedRow);
    } catch (error) {
        if (error instanceof Error) {
            sendJSON(res, 400, { error: error.message });
        } else {
            console.error(error);
            sendJSON(res, 500, { error: 'Internal server error' });
        }
    }
});

db.on('COMMIT', async () => {
    console.log('DB.COMMIT');
});

// --------------------------------------------

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Увеличиваем счетчик запросов для статистики
    if (statistics.isCollecting && 
        parsedUrl.pathname.startsWith('/api/') && 
        parsedUrl.pathname !== '/api/ss') {
    }

    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        try {
            const htmlContent = await readHTMLFile();
            sendHTML(res, 200, htmlContent);
        } catch (error) {
            console.error('Error reading HTML file:', error);
            sendJSON(res, 500, { error: 'Cannot load HTML page' });
        }
        return;
    }

    if (parsedUrl.pathname === '/api/db') {
        db.emit(req.method, req, res);
    } else if (parsedUrl.pathname === '/api/data') {
        if (req.method === 'GET') {
            db.emit('GET', req, res);
        } else if (req.method === 'POST') {
            db.emit('POST', req, res);
        } else {
            sendJSON(res, 405, { error: 'Method Not Allowed' });
        }
    } else if (parsedUrl.pathname.startsWith('/api/data/')) {
        const pathParts = parsedUrl.pathname.split('/');
        const id = parseInt(pathParts[3]);

        if (req.method === 'PUT') {
            db.emit('PUT', req, res, id);
        } else if (req.method === 'DELETE') {
            db.emit('DELETE', req, res, id);
        }
    } else if (parsedUrl.pathname === '/api/ss' && req.method === 'GET') {
        // Эндпоинт для получения статистики
        const statsResult = {
            start: statistics.start,
            finish: statistics.finish,
            request: statistics.requestCount,
            commit: statistics.commitCount
        };
        sendJSON(res, 200, statsResult);
    } else {
        sendJSON(res, 404, { error: 'Not Found' });
    }
});

server.listen(5000, () => {
    console.log('Server 05-01 running at http://localhost:5000');
    
    setupCommandHandling(server);
});