const http = require("http");

http
  .createServer((request, response) => {
    if (request.url !== "/api/name") {
      response.writeHead(404, { "content-type": "text/plain, charset=utf8" });
      response.end("Not found");
    } else {
      response.writeHead(200, { "content-type": "text/plain, charset=utf8" });
      response.end("Ярохович Станислав Александрович");
    }
  })
  .listen(3000, () => {
    console.log("Сервер прослушивается...");
  });
