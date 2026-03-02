const http = require('http');
const url = require('url');
const data = require('./database');

const db = new data.DB();

// -----------------------------------------

function sendJSON(res, statusCode, obj) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
}

async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', str => body += str.toString());
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

// ----------------------------------------- слушатели

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
        const row = JSON.parse(body);
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

db.on('PUT', async (req, res) => {
    try {
        console.log('DB.PUT');
        const body = await parseBody(req);
        const row = JSON.parse(body);
        const updatedRow = await db.update(row);
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

db.on('DELETE', async (req, res) => {
    try {
        console.log('DB.DELETE');
        const parsedUrl = url.parse(req.url, true);
        const id = parseInt(parsedUrl.query.id);

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

// ------------------------------------------------

http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/db') {
        db.emit(req.method, req, res);      // генератор события
    } else {
        sendJSON(res, 404, { error: 'Not Found' });
    }
}).listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});
