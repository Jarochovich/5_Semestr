const http = require("http");

function headers(r) {
  let rc = "";
  for (const header in r.headers) {
    rc += `<h1>${header}: ${r.headers[header]}</h1>`;
  }
  return rc;
}

http.createServer((request, response) => {
    let body = "";

    request.on("data", (str) => {
      body += str;
      console.log("data", body);
    });

    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    request.on("end", () => response.end(
        `<h2>Метод: ${request.method}</h2>
         <h2>URI: ${request.url}</h2>
         <h2>Версия: ${request.httpVersion}</h2>
         <h2>Заголовки: ${headers(request)}</h2>
         <h2>Тело: ${body}</h2>`
      )
    );

  })
  .listen(3000, () => {
    console.log("Прослушивание сервера...");
  });
