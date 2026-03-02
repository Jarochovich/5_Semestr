const http = require("http");
const fs = require("fs");
const path = require("path");
const sql = require("mssql");
const url = require("url");

// Настройки SQL Server
const config = {
  server: "localhost",
  database: "YSA",
  user: "student",
  password: "fitfit",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;
let poolConnect;

async function initDB() {
  try {
    pool = new sql.ConnectionPool(config);
    poolConnect = pool.connect();
    await poolConnect;
    console.log("Connected to SQL Server");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

initDB();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function trimObject(obj) {
  const trimmed = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      trimmed[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
    }
  }
  return trimmed;
}

// Функции валидации (без изменений)
function validateFaculty(data) {
  const errors = [];
  if (!data.FACULTY) errors.push("Код факультета обязателен");
  else if (data.FACULTY.length > 10) errors.push("Код факультета не может быть длиннее 10 символов");
  if (!data.FACULTY_NAME) errors.push("Название факультета обязательно");
  else if (data.FACULTY_NAME.length > 80) errors.push("Название факультета не может быть длиннее 80 символов");
  return errors;
}

function validatePulpit(data) {
  const errors = [];
  if (!data.PULPIT) errors.push("Код кафедры обязателен");
  else if (data.PULPIT.length > 30) errors.push("Код кафедры не может быть длиннее 30 символов");
  if (!data.PULPIT_NAME) errors.push("Название кафедры обязательно");
  else if (data.PULPIT_NAME.length > 170) errors.push("Название кафедры не может быть длиннее 170 символов");
  if (!data.FACULTY) errors.push("Код факультета обязателен");
  else if (data.FACULTY.length > 10) errors.push("Код факультета не может быть длиннее 10 символов");
  return errors;
}

function validateSubject(data) {
  const errors = [];
  if (!data.SUBJECT) errors.push("Код дисциплины обязателен");
  else if (data.SUBJECT.length > 30) errors.push("Код дисциплины не может быть длиннее 30 символов");
  if (!data.SUBJECT_NAME) errors.push("Название дисциплины обязательно");
  else if (data.SUBJECT_NAME.length > 100) errors.push("Название дисциплины не может быть длиннее 100 символов");
  if (!data.PULPIT) errors.push("Код кафедры обязателен");
  else if (data.PULPIT.length > 30) errors.push("Код кафедры не может быть длиннее 30 символов");
  return errors;
}

function validateAuditoriumType(data) {
  const errors = [];
  if (!data.AUDITORIUM_TYPE) errors.push("Тип аудитории обязателен");
  else if (data.AUDITORIUM_TYPE.length > 60) errors.push("Тип аудитории не может быть длиннее 60 символов");
  if (!data.AUDITORIUM_TYPENAME) errors.push("Название типа аудитории обязательно");
  else if (data.AUDITORIUM_TYPENAME.length > 60) errors.push("Название типа аудитории не может быть длиннее 60 символов");
  return errors;
}

function validateAuditorium(data) {
  const errors = [];
  if (!data.AUDITORIUM) errors.push("Код аудитории обязателен");
  else if (data.AUDITORIUM.length > 10) errors.push("Код аудитории не может быть длиннее 10 символов");
  if (!data.AUDITORIUM_NAME) errors.push("Название аудитории обязательно");
  else if (data.AUDITORIUM_NAME.length > 200) errors.push("Название аудитории не может быть длиннее 200 символов");
  if (!data.AUDITORIUM_TYPE) errors.push("Тип аудитории обязателен");
  else if (data.AUDITORIUM_TYPE.length > 60) errors.push("Тип аудитории не может быть длиннее 60 символов");
  if (data.AUDITORIUM_CAPACITY !== undefined && data.AUDITORIUM_CAPACITY !== null) {
    const capacity = parseInt(data.AUDITORIUM_CAPACITY);
    if (isNaN(capacity)) errors.push("Вместимость должна быть числом");
    else if (capacity < 0) errors.push("Вместимость не может быть отрицательной");
    else if (capacity > 1000) errors.push("Вместимость не может превышать 1000");
  }
  return errors;
}

function validateTeacher(data) {
  const errors = [];
  if (!data.TEACHER) errors.push("Код преподавателя обязателен");
  else if (data.TEACHER.length > 30) errors.push("Код преподавателя не может быть длиннее 30 символов");
  if (!data.TEACHER_NAME) errors.push("ФИО преподавателя обязательно");
  else if (data.TEACHER_NAME.length > 70) errors.push("ФИО преподавателя не может быть длиннее 70 символов");
  if (!data.PULPIT) errors.push("Код кафедры обязателен");
  else if (data.PULPIT.length > 30) errors.push("Код кафедры не может быть длиннее 30 символов");
  return errors;
}

// Улучшенная функция для проверки внешних ключей
async function checkForeignKeyExists(request, table, field, value) {
  try {
    // Используем разные имена параметров для разных вызовов
    const paramName = `value_${table}_${field}`;
    const result = await request
      .input(paramName, sql.NVarChar, value)
      .query(`SELECT COUNT(*) as count FROM ${table} WHERE RTRIM(${field}) = @${paramName}`);
    
    return result.recordset[0].count > 0;
  } catch (err) {
    console.error(`Error checking foreign key in ${table}.${field}:`, err);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  
  const decodedPathname = decodeURIComponent(parsedUrl.pathname);
  const pathParts = decodedPathname.split("/").filter((p) => p);

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  console.log(`${method} ${decodedPathname}`);

  try {
    if (method === "GET" && decodedPathname === "/") {
      const filePath = path.join(__dirname, "index.html");
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Не удалось прочитать файл" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
        res.end(data);
      });
      return;
    }

    if (pathParts[0] === "api") {
      await poolConnect;
      
      // создаем новый request для каждого запроса
      const request = pool.request();

      // FACULTIES
      if (pathParts[1] === "faculties") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM FACULTY");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET faculties error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);

          const validationErrors = validateFaculty(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          try {
            // Создаем новый request для проверки
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('facultyCheck', sql.NVarChar, data.FACULTY)
              .query(`SELECT * FROM FACULTY WHERE RTRIM(FACULTY) = @facultyCheck`);
            
            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Факультет с таким кодом уже существует" }));
              return;
            }

            // Создаем новый request для вставки
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('faculty', sql.NVarChar, data.FACULTY)
              .input('facultyName', sql.NVarChar, data.FACULTY_NAME)
              .query(`INSERT INTO FACULTY (FACULTY, FACULTY_NAME) 
                      OUTPUT INSERTED.* 
                      VALUES (@faculty, @facultyName)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST faculty error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && pathParts.length === 2) {
          const data = await parseBody(req);

          if (!data.FACULTY) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан FACULTY для обновления" }));
            return;
          }

          const validationErrors = validateFaculty(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          const updates = [];
          const inputs = [];
          
          if (data.FACULTY_NAME) {
            updates.push(`FACULTY_NAME = @facultyName`);
            inputs.push(['facultyName', sql.NVarChar, data.FACULTY_NAME]);
          }

          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }

          try {
            const updateRequest = pool.request();
            updateRequest.input('facultyCode', sql.NVarChar, data.FACULTY);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE FACULTY SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(FACULTY) = @facultyCode`
            );

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Факультет не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT faculty error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "DELETE" && pathParts.length === 3) {
          const facultyCode = pathParts[2];
          
          try {
            // Проверяем связанные кафедры
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('facultyCheck', sql.NVarChar, facultyCode)
              .query(`SELECT COUNT(*) as count FROM PULPIT WHERE RTRIM(FACULTY) = @facultyCheck`);
            
            if (checkResult.recordset[0].count > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Невозможно удалить факультет. Существуют связанные кафедры" }));
              return;
            }

            // Удаляем
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('facultyCode', sql.NVarChar, facultyCode)
              .query(`DELETE FROM FACULTY OUTPUT DELETED.* WHERE RTRIM(FACULTY) = @facultyCode`);

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Факультет не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE faculty error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }

      // PULPITS
      if (pathParts[1] === "pulpits") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM PULPIT");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET pulpits error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);

          const validationErrors = validatePulpit(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          try {
            // Проверяем существование факультета
            const facultyExists = await checkForeignKeyExists(pool.request(), "FACULTY", "FACULTY", data.FACULTY);
            if (!facultyExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанный факультет не существует" }));
              return;
            }

            // Проверяем существование кафедры
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('pulpitCheck', sql.NVarChar, data.PULPIT)
              .query(`SELECT * FROM PULPIT WHERE RTRIM(PULPIT) = @pulpitCheck`);
            
            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Кафедра с таким кодом уже существует" }));
              return;
            }

            // Вставляем новую кафедру
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('pulpitCode', sql.NVarChar, data.PULPIT)
              .input('pulpitName', sql.NVarChar, data.PULPIT_NAME)
              .input('facultyCode', sql.NVarChar, data.FACULTY)
              .query(`INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY) 
                      OUTPUT INSERTED.* 
                      VALUES (@pulpitCode, @pulpitName, @facultyCode)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST pulpit error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && pathParts.length === 2) {
          const data = await parseBody(req);

          if (!data.PULPIT) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан PULPIT для обновления" }));
            return;
          }

          const validationErrors = validatePulpit(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          if (data.FACULTY) {
            const facultyExists = await checkForeignKeyExists(pool.request(), "FACULTY", "FACULTY", data.FACULTY);
            if (!facultyExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанный факультет не существует" }));
              return;
            }
          }

          const updates = [];
          const inputs = [];
          
          if (data.PULPIT_NAME) {
            updates.push(`PULPIT_NAME = @pulpitName`);
            inputs.push(['pulpitName', sql.NVarChar, data.PULPIT_NAME]);
          }
          if (data.FACULTY) {
            updates.push(`FACULTY = @facultyCode`);
            inputs.push(['facultyCode', sql.NVarChar, data.FACULTY]);
          }

          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }

          try {
            const updateRequest = pool.request();
            updateRequest.input('pulpitCode', sql.NVarChar, data.PULPIT);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE PULPIT SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(PULPIT) = @pulpitCode`
            );

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Кафедра не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT pulpit error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "DELETE" && pathParts.length === 3) {
          const pulpitCode = pathParts[2];
        
          try {
            // Проверяем связанные записи
            const checkRequest1 = pool.request();
            const teacherCheck = await checkRequest1
              .input('pulpitCheck', sql.NVarChar, pulpitCode)
              .query(`SELECT COUNT(*) as count FROM TEACHER WHERE RTRIM(PULPIT) = @pulpitCheck`);
            
            const checkRequest2 = pool.request();
            const subjectCheck = await checkRequest2
              .input('pulpitCheck2', sql.NVarChar, pulpitCode)
              .query(`SELECT COUNT(*) as count FROM SUBJECT WHERE RTRIM(PULPIT) = @pulpitCheck2`);
            
            if (teacherCheck.recordset[0].count > 0 || subjectCheck.recordset[0].count > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ 
                error: "Невозможно удалить кафедру. Существуют связанные преподаватели или дисциплины" 
              }));
              return;
            }

            // Удаляем кафедру
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('pulpitCode', sql.NVarChar, pulpitCode)
              .query(`DELETE FROM PULPIT OUTPUT DELETED.* WHERE RTRIM(PULPIT) = @pulpitCode`);
          
            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Кафедра не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE pulpit error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }

      // SUBJECTS
      if (pathParts[1] === "subjects") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM SUBJECT");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET subjects error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);

          const validationErrors = validateSubject(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          try {
            // Проверяем существование кафедры
            const pulpitExists = await checkForeignKeyExists(pool.request(), "PULPIT", "PULPIT", data.PULPIT);
            if (!pulpitExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанная кафедра не существует" }));
              return;
            }

            // Проверяем существование дисциплины
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('subjectCheck', sql.NVarChar, data.SUBJECT)
              .query(`SELECT * FROM SUBJECT WHERE RTRIM(SUBJECT) = @subjectCheck`);
            
            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Дисциплина с таким кодом уже существует" }));
              return;
            }

            // Вставляем новую дисциплину
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('subjectCode', sql.NVarChar, data.SUBJECT)
              .input('subjectName', sql.NVarChar, data.SUBJECT_NAME)
              .input('pulpitCode', sql.NVarChar, data.PULPIT)
              .query(`INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT) 
                      OUTPUT INSERTED.* 
                      VALUES (@subjectCode, @subjectName, @pulpitCode)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST subject error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && pathParts.length === 2) {
          const data = await parseBody(req);

          if (!data.SUBJECT) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан SUBJECT для обновления" }));
            return;
          }

          const validationErrors = validateSubject(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          if (data.PULPIT) {
            const pulpitExists = await checkForeignKeyExists(pool.request(), "PULPIT", "PULPIT", data.PULPIT);
            if (!pulpitExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанная кафедра не существует" }));
              return;
            }
          }

          const updates = [];
          const inputs = [];
          
          if (data.SUBJECT_NAME) {
            updates.push(`SUBJECT_NAME = @subjectName`);
            inputs.push(['subjectName', sql.NVarChar, data.SUBJECT_NAME]);
          }
          if (data.PULPIT) {
            updates.push(`PULPIT = @pulpitCode`);
            inputs.push(['pulpitCode', sql.NVarChar, data.PULPIT]);
          }

          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }

          try {
            const updateRequest = pool.request();
            updateRequest.input('subjectCode', sql.NVarChar, data.SUBJECT);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE SUBJECT SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(SUBJECT) = @subjectCode`
            );

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Дисциплина не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT subject error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "DELETE" && pathParts.length === 3) {
          const subjectCode = pathParts[2];

          try {
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('subjectCode', sql.NVarChar, subjectCode)
              .query(`DELETE FROM SUBJECT OUTPUT DELETED.* WHERE RTRIM(SUBJECT) = @subjectCode`);

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Дисциплина не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE subject error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }

      // AUDITORIUMSTYPES
      if (pathParts[1] === "auditoriumstypes") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM AUDITORIUM_TYPE");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET auditoriumstypes error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);

          const validationErrors = validateAuditoriumType(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          try {
            // Проверяем существование типа аудитории
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('typeCheck', sql.NVarChar, data.AUDITORIUM_TYPE)
              .query(`SELECT * FROM AUDITORIUM_TYPE WHERE RTRIM(AUDITORIUM_TYPE) = @typeCheck`);
            
            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Тип аудитории с таким кодом уже существует" }));
              return;
            }

            // Вставляем новый тип
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('typeCode', sql.NVarChar, data.AUDITORIUM_TYPE)
              .input('typeName', sql.NVarChar, data.AUDITORIUM_TYPENAME)
              .query(`INSERT INTO AUDITORIUM_TYPE (AUDITORIUM_TYPE, AUDITORIUM_TYPENAME) 
                      OUTPUT INSERTED.* 
                      VALUES (@typeCode, @typeName)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST auditoriumstypes error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && pathParts.length === 2) {
          const data = await parseBody(req);

          if (!data.AUDITORIUM_TYPE) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан AUDITORIUM_TYPE для обновления" }));
            return;
          }

          const validationErrors = validateAuditoriumType(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          const updates = [];
          const inputs = [];
          
          if (data.AUDITORIUM_TYPENAME) {
            updates.push(`AUDITORIUM_TYPENAME = @typeName`);
            inputs.push(['typeName', sql.NVarChar, data.AUDITORIUM_TYPENAME]);
          }

          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }

          try {
            const updateRequest = pool.request();
            updateRequest.input('typeCode', sql.NVarChar, data.AUDITORIUM_TYPE);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE AUDITORIUM_TYPE SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(AUDITORIUM_TYPE) = @typeCode`
            );

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Тип аудитории не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT auditoriumstypes error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Исправлен путь: api/auditoriumtypes/xyz (не auditoriumstypes)
        if (method === "DELETE" && pathParts[1] === "auditoriumtypes" && pathParts.length === 3) {
          const auditoriumTypeCode = pathParts[2];

          try {
            // Проверяем связанные аудитории
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('typeCheck', sql.NVarChar, auditoriumTypeCode)
              .query(`SELECT COUNT(*) as count FROM AUDITORIUM WHERE RTRIM(AUDITORIUM_TYPE) = @typeCheck`);
            
            if (checkResult.recordset[0].count > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Невозможно удалить тип аудитории. Существуют связанные аудитории" }));
              return;
            }

            // Удаляем
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('typeCode', sql.NVarChar, auditoriumTypeCode)
              .query(`DELETE FROM AUDITORIUM_TYPE OUTPUT DELETED.* WHERE RTRIM(AUDITORIUM_TYPE) = @typeCode`);

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Тип аудитории не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE auditoriumtypes error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }

      // AUDITORIUMS (обратите внимание на исправление пути в таблице требований)
      if (pathParts[1] === "auditoriums" || pathParts[1] === "auditorims") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM AUDITORIUM");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET auditoriums error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);
        
          const validationErrors = validateAuditorium(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }
        
          try {
            // Проверяем существование типа аудитории
            const typeExists = await checkForeignKeyExists(pool.request(), "AUDITORIUM_TYPE", "AUDITORIUM_TYPE", data.AUDITORIUM_TYPE);
            if (!typeExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанный тип аудитории не существует" }));
              return;
            }
          
            // Проверяем существование аудитории
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('auditoriumCheck', sql.NVarChar, data.AUDITORIUM)
              .query(`SELECT * FROM AUDITORIUM WHERE RTRIM(AUDITORIUM) = @auditoriumCheck`);

            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Аудитория с таким кодом уже существует" }));
              return;
            }
          
            const capacity = data.AUDITORIUM_CAPACITY ? parseInt(data.AUDITORIUM_CAPACITY) : 0;
            
            // Вставляем новую аудиторию
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('auditoriumCode', sql.NVarChar, data.AUDITORIUM)
              .input('auditoriumName', sql.NVarChar, data.AUDITORIUM_NAME)
              .input('auditoriumType', sql.NVarChar, data.AUDITORIUM_TYPE)
              .input('capacity', sql.Int, capacity)
              .query(`INSERT INTO AUDITORIUM (AUDITORIUM, AUDITORIUM_NAME, AUDITORIUM_TYPE, AUDITORIUM_CAPACITY) 
                      OUTPUT INSERTED.* 
                      VALUES (@auditoriumCode, @auditoriumName, @auditoriumType, @capacity)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST auditoriums error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && (pathParts.length === 2 || (pathParts[1] === "auditorims" && pathParts.length === 2))) {
          const data = await parseBody(req);
        
          if (!data.AUDITORIUM) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан AUDITORIUM для обновления" }));
            return;
          }
        
          const validationErrors = validateAuditorium(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }
        
          if (data.AUDITORIUM_TYPE) {
            const typeExists = await checkForeignKeyExists(pool.request(), "AUDITORIUM_TYPE", "AUDITORIUM_TYPE", data.AUDITORIUM_TYPE);
            if (!typeExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанный тип аудитории не существует" }));
              return;
            }
          }
        
          const updates = [];
          const inputs = [];
          
          if (data.AUDITORIUM_NAME) {
            updates.push(`AUDITORIUM_NAME = @auditoriumName`);
            inputs.push(['auditoriumName', sql.NVarChar, data.AUDITORIUM_NAME]);
          }
          if (data.AUDITORIUM_TYPE) {
            updates.push(`AUDITORIUM_TYPE = @auditoriumType`);
            inputs.push(['auditoriumType', sql.NVarChar, data.AUDITORIUM_TYPE]);
          }
          if (data.AUDITORIUM_CAPACITY !== undefined && data.AUDITORIUM_CAPACITY !== null) {
            const capacity = parseInt(data.AUDITORIUM_CAPACITY);
            updates.push(`AUDITORIUM_CAPACITY = @capacity`);
            inputs.push(['capacity', sql.Int, capacity]);
          }
        
          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }
        
          try {
            const updateRequest = pool.request();
            updateRequest.input('auditoriumCode', sql.NVarChar, data.AUDITORIUM);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE AUDITORIUM SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(AUDITORIUM) = @auditoriumCode`
            );
          
            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Аудитория не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT auditoriums error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "DELETE" && pathParts.length === 3) {
          const auditoriumCode = pathParts[2];

          try {
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('auditoriumCode', sql.NVarChar, auditoriumCode)
              .query(`DELETE FROM AUDITORIUM OUTPUT DELETED.* WHERE RTRIM(AUDITORIUM) = @auditoriumCode`);

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Аудитория не найдена" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE auditoriums error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }

      // TEACHERS
      if (pathParts[1] === "teachers") {
        if (method === "GET" && pathParts.length === 2) {
          try {
            const result = await request.query("SELECT * FROM TEACHER");
            const cleanRecords = result.recordset.map(trimObject);
            res.end(JSON.stringify(cleanRecords, null, 2));
          } catch (err) {
            console.error("GET teachers error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "POST" && pathParts.length === 2) {
          const data = await parseBody(req);

          const validationErrors = validateTeacher(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          try {
            // Проверяем существование кафедры
            const pulpitExists = await checkForeignKeyExists(pool.request(), "PULPIT", "PULPIT", data.PULPIT);
            if (!pulpitExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанная кафедра не существует" }));
              return;
            }

            // Проверяем существование
            const checkRequest = pool.request();
            const checkResult = await checkRequest
              .input('teacherCheck', sql.NVarChar, data.TEACHER)
              .query(`SELECT * FROM TEACHER WHERE RTRIM(TEACHER) = @teacherCheck`);
            
            if (checkResult.recordset.length > 0) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Преподаватель с таким кодом уже существует" }));
              return;
            }

            // Вставляем нового
            const insertRequest = pool.request();
            const result = await insertRequest
              .input('teacherCode', sql.NVarChar, data.TEACHER)
              .input('teacherName', sql.NVarChar, data.TEACHER_NAME)
              .input('pulpitCode', sql.NVarChar, data.PULPIT)
              .query(`INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT) 
                      OUTPUT INSERTED.* 
                      VALUES (@teacherCode, @teacherName, @pulpitCode)`);
            
            res.writeHead(201);
            const cleanRecord = trimObject(result.recordset[0]);
            res.end(JSON.stringify(cleanRecord, null, 2));
          } catch (err) {
            console.error("POST teacher error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "PUT" && pathParts.length === 2) {
          const data = await parseBody(req);

          if (!data.TEACHER) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Не указан TEACHER для обновления" }));
            return;
          }

          const validationErrors = validateTeacher(data);
          if (validationErrors.length > 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: validationErrors.join(", ") }));
            return;
          }

          if (data.PULPIT) {
            const pulpitExists = await checkForeignKeyExists(pool.request(), "PULPIT", "PULPIT", data.PULPIT);
            if (!pulpitExists) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Указанная кафедра не существует" }));
              return;
            }
          }

          const updates = [];
          const inputs = [];
          
          if (data.TEACHER_NAME) {
            updates.push(`TEACHER_NAME = @teacherName`);
            inputs.push(['teacherName', sql.NVarChar, data.TEACHER_NAME]);
          }
          if (data.PULPIT) {
            updates.push(`PULPIT = @pulpitCode`);
            inputs.push(['pulpitCode', sql.NVarChar, data.PULPIT]);
          }

          if (updates.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Нет данных для обновления" }));
            return;
          }

          try {
            const updateRequest = pool.request();
            updateRequest.input('teacherCode', sql.NVarChar, data.TEACHER);
            
            inputs.forEach(([name, type, value]) => {
              updateRequest.input(name, type, value);
            });
            
            const result = await updateRequest.query(
              `UPDATE TEACHER SET ${updates.join(", ")} 
               OUTPUT INSERTED.* 
               WHERE RTRIM(TEACHER) = @teacherCode`
            );

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Преподаватель не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("PUT teacher error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (method === "DELETE" && pathParts.length === 3) {
          const teacherCode = pathParts[2];

          try {
            const deleteRequest = pool.request();
            const result = await deleteRequest
              .input('teacherCode', sql.NVarChar, teacherCode)
              .query(`DELETE FROM TEACHER OUTPUT DELETED.* WHERE RTRIM(TEACHER) = @teacherCode`);

            if (result.recordset.length === 0) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: "Преподаватель не найден" }));
            } else {
              const cleanRecord = trimObject(result.recordset[0]);
              res.end(JSON.stringify(cleanRecord, null, 2));
            }
          } catch (err) {
            console.error("DELETE teacher error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
      }
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Не найдено" }));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Внутренняя ошибка сервера" }));
  }
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});