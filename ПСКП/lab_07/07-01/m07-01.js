const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.docx': 'application/msword',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.mp4': 'video/mp4'
};

module.exports = function(staticDir) {
    return function(req, res) {
        if (req.method !== 'GET') {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('405 Method Not Allowed');
            return;
        }

        // путь к файлу и замена
        let filePath = decodeURIComponent(req.url);
        if (filePath === '/' || filePath === '') {
            filePath = '/index.html';
        }

        const fullPath = path.join(staticDir, filePath);

        const ext = path.extname(fullPath).toLowerCase();
        const mimeType = mimeTypes[ext];

        if (!mimeType) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: unsupported file type');
            return;
        }

        fs.stat(fullPath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            res.writeHead(200, { 'Content-Type': mimeType });
            const stream = fs.createReadStream(fullPath);
            stream.pipe(res);
        });
    };
};
