const http = require('http');
const path = require('path');
const createStaticHandler = require('./m07-01');

const staticDir = path.join(__dirname, 'static');
const staticHandler = createStaticHandler(staticDir);

const server = http.createServer((req, res) => {
    staticHandler(req, res);
})
.listen(5000, () => {
    console.log('Server 07-01 running at http://localhost:5000');
});
