const http = require('http');

const requestData = {
    "__comment": "Запрос.Лабораторная работа 8/10",
    "x": 7,
    "y": 15,
    "s": "Awdos",
    "m": ["a", "b", "c"],
    "o": {
        "name": "Спанч Боб",
        "surname": "Квадратные штаны"
    }
};

const postData = JSON.stringify(requestData);

const options = {
    hostname: 'localhost',
    port: 5000,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log('Статус ответа: ', res.statusCode);
    console.log('Сообщение к статусу ', res.statusMessage);
    console.log('IP-адрес удаленного сервера:', options.hostname);
    console.log('Порт удаленного сервера:', options.port);
    
    let responseData = '';
    res.on('data', chunk => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Тело ответа:', responseData);
    });
});

req.write(postData);
req.end();