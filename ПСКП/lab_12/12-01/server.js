const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let subscribers = [];

const STUD_FILE = path.join(__dirname, 'StudentList.json');

// отправка всем подписчикам
function notifyAll(message) {
    subscribers.forEach(res => {
        res.write(`data: ${message}\n\n`);
    });
}

// чтение файла
function readStudents() {
    if (!fs.existsSync(STUD_FILE)) fs.writeFileSync(STUD_FILE, '[]');
    return JSON.parse(fs.readFileSync(STUD_FILE));
}

// запись в файл
function writeStudents(data) {
    fs.writeFileSync(STUD_FILE, JSON.stringify(data, null, 2));
}

function sendJSON(res, code, obj) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
}

function getTimestamp() {
    const d = new Date();
    return (
        d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') +
        String(d.getHours()).padStart(2, '0') +
        String(d.getSeconds()).padStart(2, '0')
    );
}

function sendError(res, code, messErr, message) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        error: messErr,
        message: message
    }));
}


// СЕРВЕР
const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsed.pathname;

    // подписка
    if (pathname === '/subscribe') {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });
        res.write("\n");

        subscribers.push(res);

        req.on('close', () => {
            subscribers = subscribers.filter(r => r !== res);
        });
        return;
    }

    // GET
    if (method === "GET" && pathname === "/") {
        const students = readStudents();
        return sendJSON(res, 200, students);
    }

    // GET /n
    if (method === "GET" && /^\/\d+$/.test(pathname)) {
        const id = parseInt(pathname.split('/')[1]);
        const students = readStudents();
        const st = students.find(s => s.id === id);

        if (!st) return sendError(res, 404, 2, `Студент c id ${id} не найден`);

        return sendJSON(res, 200, st);
    }

    // POST
    if (method === "POST" && pathname === "/") {
        let body = "";
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newStudent = JSON.parse(body);
                const students = readStudents();

                if (students.some(s => s.id === newStudent.id)) {
                    return sendError(res, 409, 3, " Студент с таким id уже существует");
                }

                students.push(newStudent);
                writeStudents(students);
                return sendJSON(res, 201, newStudent);

            } catch {
                return sendError(res, 400, 1, "Некорректный JSON");
            }
        });
        return;
    }

    // PUT
    if (method === "PUT" && pathname === "/") {
        let body = "";
        req.on('data', ch => body += ch);
        req.on('end', () => {
            try {
                const update = JSON.parse(body);
                const students = readStudents();

                const idx = students.findIndex(s => s.id === update.id);
                if (idx === -1)
                    return sendError(res, 404, 2, `Студент c id ${update.id} не найден`);

                students[idx] = update;
                writeStudents(students);
                return sendJSON(res, 200, update);

            } catch {
                return sendError(res, 400, 1, "Некорректный JSON");
            }
        });
        return;
    }

    // DELETE /n
    if (method === "DELETE" && /^\/\d+$/.test(pathname)) {
        const id = parseInt(pathname.slice(1));
        const students = readStudents();
        const idx = students.findIndex(s => s.id === id);

        if (idx === -1)
            return sendError(res, 404, 2, `Студент c id ${id} не найден`);

        const deleted = students.splice(idx, 1)[0];
        writeStudents(students);

        return sendJSON(res, 200, deleted);
    }

    // POST /backup
    if (method === "POST" && pathname === "/backup") {
        const delaySecond = 2;
        const timestamp = getTimestamp();
        const name = `${timestamp}_StudentList.json`;
        const dest = path.join(__dirname, name);

        setTimeout(() => {
            fs.copyFileSync(STUD_FILE, dest);
            notifyAll(`Backup created: ${name}`);
        }, delaySecond);

        return sendJSON(res, 200, {
            status: `Создание копии через ${delaySecond} секунд(ы)`,
            file: name
        });
    }

    // DELETE /backup/yyyyddmm
    if (method === "DELETE" && pathname.startsWith("/backup/")) {
    const dateString = pathname.split('/')[2];
    
    // Проверяем формат YYYYddmm
    if (!/^\d{8}$/.test(dateString)) {
        return sendError(res, 400, 4, "Неверный формат даты. Используйте YYYYddmm");
    }
    
    // Парсим дату в формате YYYYddmm
    const year = parseInt(dateString.substring(0, 4));
    const day = parseInt(dateString.substring(4, 6));   // День на позициях 4-5
    const month = parseInt(dateString.substring(6, 8)); // Месяц на позициях 6-7
    
    // Преобразуем в стандартный формат YYYYMMdd для сравнения
    const limitDateString = 
        year.toString() +
        String(month).padStart(2, '0') +
        String(day).padStart(2, '0');
    // Пример: "20251712" → "20251217"
    
    // Валидация
    if (month < 1 || month > 12) {
        return sendError(res, 400, 4, `Неверный месяц: ${month}. Месяц должен быть от 01 до 12`);
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
        return sendError(res, 400, 4, `Неверный день: ${day}. В месяце ${month} года ${year} только ${daysInMonth} дней`);
    }
    
    try {
        const files = fs.readdirSync(__dirname)
            .filter(f => f.endsWith("_StudentList.json"));
        
        const removed = [];
        const errors = [];
        
        for (const f of files) {
            try {
                const timestamp = f.split("_")[0];
                
                if (timestamp.length < 8) {
                    errors.push(`${f}: некорректный формат имени файла`);
                    continue;
                }
                
                const fileDate = timestamp.substring(0, 8); // В имени файла YYYYMMdd
                // Пример: "202512151203" → "20251215"
                
                if (!/^\d{8}$/.test(fileDate)) {
                    errors.push(`${f}: некорректная дата в имени файла`);
                    continue;
                }
                
                console.log(`Сравниваем: ${fileDate} < ${limitDateString} = ${fileDate < limitDateString}`);
                
                if (fileDate < limitDateString) {
                    fs.unlinkSync(path.join(__dirname, f));
                    removed.push({
                        filename: f,
                        fileDate: fileDate,
                        limitDate: limitDateString,
                        originalRequest: dateString,
                        deleted: true
                    });
                    notifyAll(`Backup deleted: ${f}`);
                }
                
            } catch (err) {
                errors.push(`${f}: ${err.message}`);
            }
        }
        
        const response = { 
            removed,
            originalRequest: dateString, // Оригинальный запрос
            parsedDate: limitDateString, // Преобразованная дата
            totalRemoved: removed.length, // Количество удаленных
            message: `Удалено ${removed.length} файлов с датой в имени до ${limitDateString} (из запроса ${dateString})`
        };
        
        if (errors.length > 0) {
            response.errors = errors;
        }
        
        return sendJSON(res, 200, response);
        
    } catch (err) {
        return sendError(res, 500, 5, `Ошибка при удалении бэкапов: ${err.message}`);
    }
}

    // GET /backup
    if (method === "GET" && pathname === "/backup") {
        const files = fs.readdirSync(__dirname)
            .filter(f => f.endsWith("_StudentList.json"));
        if (files.length < 1) return sendError(res, 404, 1, "Файлы backup не найдены");
        return sendJSON(res, 200, files);
    }

    res.writeHead(404);
    res.end("Not found");
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});