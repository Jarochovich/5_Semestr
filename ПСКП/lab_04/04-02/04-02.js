const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const data = require('./database');

const db = new data.DB();

// -------------------------------------------

function sendJSON(res, statusCode, obj) {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json; charset=utf-8',});
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

// ---------------------------------------------

db.on('GET', async (req, res) => {
    try {
        console.log('DB.GET');

        const rows = await db.select();
        sendJSON(res, 200, rows);
    } catch (error) {
        console.error(error);
        sendJSON(res, 500, { error: 'Internal server error' });
    }
});

db.on('POST', async (req, res) => {
    try {
        console.log('DB.POST');

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
        console.log('DB.PUT');

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
        console.log('DB.DELETE');

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

// --------------------------------------------

http.createServer(async (req, res) => {

    const parsedUrl = url.parse(req.url, true);

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
        }
         else {
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
    } else {
        sendJSON(res, 404, { error: 'Not Found' });
    }
}).listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});