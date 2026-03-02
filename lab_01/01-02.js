const http = require("http");

http.createServer((request, response) => { 
    response.end("<h1>Hello World</h1>");
})
.listen(3000, "127.0.0.1", () => {
    console.log('Прослушивание сервера...')
});
