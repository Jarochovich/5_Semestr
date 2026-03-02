const http = require("http");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInputObjectType,
} = require("graphql");
const { graphql, GraphQLError } = require("graphql");
const sql = require("mssql");

const dbConfig = {
  server: "localhost",
  database: "YSA",
  user: "student",
  password: "fitfit",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (!body) resolve({});
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new GraphQLError("Invalid JSON body"));
      }
    });
    req.on("error", (error) => {
      reject(new GraphQLError("Request error: " + error.message));
    });
  });
}

// Генератор запросов
function buildQueryResolver(table, idField) {
  return async (_, args) => {
    try {
      const request = pool.request();
      if (args[idField.toLowerCase()]) {
        request.input(idField.toLowerCase(), sql.NVarChar, args[idField.toLowerCase()]);
        const result = await request.query(`SELECT * FROM ${table} WHERE ${idField} = @${idField.toLowerCase()}`);
        return result.recordset;
      }
      const result = await request.query(`SELECT * FROM ${table}`);
      return result.recordset;
    } catch (error) {
      console.error(`Error in ${table} query:`, error);
      throw new GraphQLError(`Database error: ${error.message}`);
    }
  };
}

// Генератор мутаций для set операций
function buildSetMutation(table, idField, fields) {
  return async (_, args) => {
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      const data = args[table.toLowerCase()];
      const checkRequest = new sql.Request(transaction);
      checkRequest.input(idField, sql.NVarChar, data[idField]);
      
      const checkResult = await checkRequest.query(
        `SELECT * FROM ${table} WHERE ${idField} = @${idField}`
      );
      
      const request = new sql.Request(transaction);
      
      // Добавляем все входные параметры
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          request.input(key, sql.NVarChar, data[key]);
        }
      });
      
      let query;
      if (checkResult.recordset.length > 0) {
        // UPDATE
        const setClause = fields
          .filter(field => field !== idField)
          .map(field => `${field} = @${field}`)
          .join(', ');
        
        query = `UPDATE ${table} SET ${setClause} WHERE ${idField} = @${idField}`;
      } else {
        // INSERT
        const fieldNames = fields.join(', ');
        const valueParams = fields.map(field => `@${field}`).join(', ');
        
        query = `INSERT INTO ${table} (${fieldNames}) VALUES (${valueParams})`;
      }
      
      await request.query(query);
      await transaction.commit();
      
      return data;
      
    } catch (error) {
      await transaction.rollback();
      console.error(`Error in set${table}:`, error);
      
      // Проверяем foreign key constraint ошибки
      if (error.message.includes('FOREIGN KEY')) {
        throw new GraphQLError(`Foreign key constraint violation. Check if referenced entity exists.`);
      }
      
      throw new GraphQLError(`Database error: ${error.message}`);
    }
  };
}

// GraphQL ТИПЫ

const FacultyType = new GraphQLObjectType({
  name: "Faculty",
  fields: () => ({
    FACULTY: { type: GraphQLString },
    FACULTY_NAME: { type: GraphQLString },
  }),
});

const PulpitType = new GraphQLObjectType({
  name: "Pulpit",
  fields: () => ({
    PULPIT: { type: GraphQLString },
    PULPIT_NAME: { type: GraphQLString },
    FACULTY: { type: GraphQLString },
  }),
});

const TeacherType = new GraphQLObjectType({
  name: "Teacher",
  fields: () => ({
    TEACHER: { type: GraphQLString },
    TEACHER_NAME: { type: GraphQLString },
    PULPIT: { type: GraphQLString },
  }),
});

const SubjectType = new GraphQLObjectType({
  name: "Subject",
  fields: () => ({
    SUBJECT: { type: GraphQLString },
    SUBJECT_NAME: { type: GraphQLString },
    PULPIT: { type: GraphQLString },
  }),
});

const PulpitWithSubjectsType = new GraphQLObjectType({
  name: "PulpitWithSubjects",
  fields: () => ({
    PULPIT: { type: GraphQLString },
    PULPIT_NAME: { type: GraphQLString },
    subjects: { type: new GraphQLList(SubjectType) },
  }),
});

// Входные типы
const FacultyInputType = new GraphQLInputObjectType({
  name: "FacultyInput",
  fields: {
    FACULTY: { type: GraphQLString },
    FACULTY_NAME: { type: GraphQLString },
  },
});

const TeacherInputType = new GraphQLInputObjectType({
  name: "TeacherInput",
  fields: {
    TEACHER: { type: GraphQLString },
    TEACHER_NAME: { type: GraphQLString },
    PULPIT: { type: GraphQLString },
  },
});

const PulpitInputType = new GraphQLInputObjectType({
  name: "PulpitInput",
  fields: {
    PULPIT: { type: GraphQLString },
    PULPIT_NAME: { type: GraphQLString },
    FACULTY: { type: GraphQLString },
  },
});

const SubjectInputType = new GraphQLInputObjectType({
  name: "SubjectInput",
  fields: {
    SUBJECT: { type: GraphQLString },
    SUBJECT_NAME: { type: GraphQLString },
    PULPIT: { type: GraphQLString },
  },
});

// GraphQL СХЕМА

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      // генератор для повторяющихся запросов
      getFaculties: {
        type: new GraphQLList(FacultyType),
        args: { faculty: { type: GraphQLString } },
        resolve: buildQueryResolver('FACULTY', 'FACULTY'),
      },

      getTeachers: {
        type: new GraphQLList(TeacherType),
        args: { teacher: { type: GraphQLString } },
        resolve: buildQueryResolver('TEACHER', 'TEACHER'),
      },

      getPulpits: {
        type: new GraphQLList(PulpitType),
        args: { pulpit: { type: GraphQLString } },
        resolve: buildQueryResolver('PULPIT', 'PULPIT'),
      },

      getSubjects: {
        type: new GraphQLList(SubjectType),
        args: { subject: { type: GraphQLString } },
        resolve: buildQueryResolver('SUBJECT', 'SUBJECT'),
      },

      getTeachersByFaculty: {
        type: new GraphQLList(TeacherType),
        args: { faculty: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.faculty) {
            throw new GraphQLError('Faculty parameter is required');
          }
          
          try {
            const result = await pool
              .request()
              .input("faculty", sql.NVarChar, args.faculty)
              .query(`
                SELECT t.* 
                FROM TEACHER t
                INNER JOIN PULPIT p ON t.PULPIT = p.PULPIT
                WHERE p.FACULTY = @faculty
              `);
            return result.recordset;
          } catch (error) {
            console.error('Error in getTeachersByFaculty:', error);
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },

      getSubjectsByFaculties: {
        type: new GraphQLList(PulpitWithSubjectsType),
        args: { faculty: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.faculty) {
            throw new GraphQLError('Faculty parameter is required');
          }
          
          try {
            const pulpitsResult = await pool
              .request()
              .input("faculty", sql.NVarChar, args.faculty)
              .query("SELECT * FROM PULPIT WHERE FACULTY = @faculty");

            const result = await Promise.all(
              pulpitsResult.recordset.map(async (pulpit) => {
                const subjectsResult = await pool
                  .request()
                  .input("pulpit", sql.NVarChar, pulpit.PULPIT)
                  .query("SELECT * FROM SUBJECT WHERE PULPIT = @pulpit");

                return {
                  PULPIT: pulpit.PULPIT,
                  PULPIT_NAME: pulpit.PULPIT_NAME,
                  subjects: subjectsResult.recordset,
                };
              })
            );

            return result;
          } catch (error) {
            console.error('Error in getSubjectsByFaculties:', error);
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },

      test: {
        type: GraphQLString,
        resolve: () => "GraphQL сервер работает!",
      },
    },
  }),

  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: {
      // Используем генератор для мутаций
      setFaculty: {
        type: FacultyType,
        args: { faculty: { type: FacultyInputType } },
        resolve: buildSetMutation('FACULTY', 'FACULTY', ['FACULTY', 'FACULTY_NAME']),
      },

      setTeacher: {
        type: TeacherType,
        args: { teacher: { type: TeacherInputType } },
        resolve: buildSetMutation('TEACHER', 'TEACHER', ['TEACHER', 'TEACHER_NAME', 'PULPIT']),
      },

      setPulpit: {
        type: PulpitType,
        args: { pulpit: { type: PulpitInputType } },
        resolve: buildSetMutation('PULPIT', 'PULPIT', ['PULPIT', 'PULPIT_NAME', 'FACULTY']),
      },

      setSubject: {
        type: SubjectType,
        args: { subject: { type: SubjectInputType } },
        resolve: buildSetMutation('SUBJECT', 'SUBJECT', ['SUBJECT', 'SUBJECT_NAME', 'PULPIT']),
      },

      // Генератор для delete операций
      delFaculty: {
        type: GraphQLBoolean,
        args: { faculty: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.faculty) {
            throw new GraphQLError('Faculty parameter is required');
          }
          
          try {
            const checkResult = await pool
              .request()
              .input("faculty", sql.NVarChar, args.faculty)
              .query("SELECT * FROM FACULTY WHERE FACULTY = @faculty");

            if (checkResult.recordset.length === 0) {
              return false;
            }

            await pool
              .request()
              .input("faculty", sql.NVarChar, args.faculty)
              .query("DELETE FROM FACULTY WHERE FACULTY = @faculty");
              
            return true;
          } catch (error) {
            console.error('Error in delFaculty:', error);
            
            if (error.message.includes('REFERENCE constraint')) {
              throw new GraphQLError('Cannot delete faculty because it has related records');
            }
            
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },

      delTeacher: {
        type: GraphQLBoolean,
        args: { teacher: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.teacher) {
            throw new GraphQLError('Teacher parameter is required');
          }
          
          try {
            const checkResult = await pool
              .request()
              .input("teacher", sql.NVarChar, args.teacher)
              .query("SELECT * FROM TEACHER WHERE TEACHER = @teacher");

            if (checkResult.recordset.length === 0) {
              return false;
            }

            await pool
              .request()
              .input("teacher", sql.NVarChar, args.teacher)
              .query("DELETE FROM TEACHER WHERE TEACHER = @teacher");
              
            return true;
          } catch (error) {
            console.error('Error in delTeacher:', error);
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },

      delPulpit: {
        type: GraphQLBoolean,
        args: { pulpit: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.pulpit) {
            throw new GraphQLError('Pulpit parameter is required');
          }
          
          try {
            const checkResult = await pool
              .request()
              .input("pulpit", sql.NVarChar, args.pulpit)
              .query("SELECT * FROM PULPIT WHERE PULPIT = @pulpit");

            if (checkResult.recordset.length === 0) {
              return false;
            }

            await pool
              .request()
              .input("pulpit", sql.NVarChar, args.pulpit)
              .query("DELETE FROM PULPIT WHERE PULPIT = @pulpit");
              
            return true;
          } catch (error) {
            console.error('Error in delPulpit:', error);
            
            if (error.message.includes('REFERENCE constraint')) {
              throw new GraphQLError('Cannot delete pulpit because it has related teachers or subjects');
            }
            
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },

      delSubject: {
        type: GraphQLBoolean,
        args: { subject: { type: GraphQLString } },
        resolve: async (_, args) => {
          if (!args.subject) {
            throw new GraphQLError('Subject parameter is required');
          }
          
          try {
            const checkResult = await pool
              .request()
              .input("subject", sql.NVarChar, args.subject)
              .query("SELECT * FROM SUBJECT WHERE SUBJECT = @subject");

            if (checkResult.recordset.length === 0) {
              return false;
            }

            await pool
              .request()
              .input("subject", sql.NVarChar, args.subject)
              .query("DELETE FROM SUBJECT WHERE SUBJECT = @subject");
              
            return true;
          } catch (error) {
            console.error('Error in delSubject:', error);
            throw new GraphQLError(`Database error: ${error.message}`);
          }
        },
      },
    },
  }),
});

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "University GraphQL API",
        version: "1.0",
        endpoints: {
          graphql: "POST /graphql",
          examples: [
            '{"query": "{ test }"}',
            '{"query": "{ getFaculties { FACULTY FACULTY_NAME } }"}',
          ],
        },
      })
    );
    return;
  }

  if (req.method === "POST" && req.url === "/graphql") {
    let body;
    
    try {
      body = await parseBody(req);
      
      if (!body.query) {
        throw new GraphQLError("No GraphQL query provided");
      }

      const result = await graphql({
        schema,
        source: body.query,
        variableValues: body.variables,
        operationName: body.operationName,
        contextValue: { pool }, // передаем пул в контекст
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      
    } catch (error) {
      console.error("GraphQL server error:", error);
      
      const statusCode = error instanceof GraphQLError ? 400 : 500;
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          errors: [
            {
              message: error.message,
              ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
            },
          ],
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: "Use POST /graphql for GraphQL requests or GET / for info",
      })
    );
  }
});

async function startServer() {
  try {
    console.log("Подключение к MSSQL...");
    pool = await sql.connect(dbConfig);
    
    // Тестируем соединение
    await pool.request().query('SELECT 1 as test');
    console.log("Успешное подключение к MSSQL");

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("Ошибка при запуске сервера:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nОстановка сервера...");
  if (pool && pool.connected) {
    await pool.close();
    console.log("Отключение от БД");
  }
  
  server.close(() => {
    console.log("Сервер остановлен");
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

startServer();