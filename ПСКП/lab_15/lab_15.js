const http = require("http");
const url = require("url");
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://student:fitfit@bstu.4o1sgnp.mongodb.net/?appName=BSTU";
const PORT = 3000;

let db;

async function connectToDatabase() {
  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: require("mongodb").ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    db = client.db("BSTU");
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    if (!db) {
      return sendResponse(res, 503, { error: "Database not connected" });
    }

    // ========== ФАКУЛЬТЕТЫ ==========

    // GET /api/faculties
    if (pathname === "/api/faculties" && method === "GET") {
      try {
        const faculties = await db.collection("faculty").find({}).toArray();
        sendResponse(res, 200, faculties);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to fetch faculties" });
      }
    }

    // POST /api/faculties
    else if (pathname === "/api/faculties" && method === "POST") {
      try {
        const body = await parseBody(req);
        const { faculty, faculty_name } = body;

        if (!faculty || !faculty_name) {
          return sendResponse(res, 400, {
            error: "Missing required fields: faculty and faculty_name",
          });
        }

        const existingFaculty = await db.collection("faculty").findOne({ faculty });
        if (existingFaculty) {
          return sendResponse(res, 409, {
            error: `Faculty with code '${faculty}' already exists`,
          });
        }

        const newFaculty = { faculty, faculty_name };
        const result = await db.collection("faculty").insertOne(newFaculty);

        newFaculty._id = result.insertedId;
        sendResponse(res, 201, newFaculty);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to create faculty" });
      }
    }

    // PUT /api/faculties
    else if (pathname === "/api/faculties" && method === "PUT") {
      try {
        const body = await parseBody(req);
        const { faculty, faculty_name } = body;

        if (!faculty) {
          return sendResponse(res, 400, {
            error: "Faculty code is required",
          });
        }

        const existingFaculty = await db.collection("faculty").findOne({ faculty });
        if (!existingFaculty) {
          return sendResponse(res, 404, {
            error: `Faculty with code '${faculty}' not found`,
          });
        }

        const updateData = {};
        if (faculty_name !== undefined) {
          if (faculty_name.trim() === "") {
            return sendResponse(res, 400, {
              error: "Faculty name cannot be empty",
            });
          }
          updateData.faculty_name = faculty_name;
        }

        // Проверяем, есть ли изменения
        if (Object.keys(updateData).length === 0) {
          return sendResponse(res, 400, {
            error: "No data provided for update",
          });
        }

        const result = await db
          .collection("faculty")
          .updateOne({ faculty }, { $set: updateData });

        const updatedFaculty = await db
          .collection("faculty")
          .findOne({ faculty });
        sendResponse(res, 200, updatedFaculty);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to update faculty" });
      }
    }

    // DELETE /api/faculties/:code
    else if (pathname.startsWith("/api/faculties/") && method === "DELETE") {
      try {
        const code = decodeURIComponent(pathname.split("/")[3]);

        // Проверяем, существует ли факультет
        const facultyToDelete = await db
          .collection("faculty")
          .findOne({ faculty: code });
        if (!facultyToDelete) {
          return sendResponse(res, 404, {
            error: `Faculty with code '${code}' not found`,
          });
        }

        // Проверяем, есть ли кафедры, привязанные к этому факультету
        const pulpitsCount = await db
          .collection("pulpit")
          .countDocuments({ faculty: code });
        
        if (pulpitsCount > 0) {
          return sendResponse(res, 400, {
            error: `Cannot delete faculty. There are ${pulpitsCount} pulpits attached to this faculty. Delete them first.`,
          });
        }

        const result = await db
          .collection("faculty")
          .deleteOne({ faculty: code });
        
        sendResponse(res, 200, facultyToDelete);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to delete faculty" });
      }
    }

    // ========== КАФЕДРЫ ==========

    // GET /api/pulpits
    else if (pathname === "/api/pulpits" && method === "GET") {
      try {
        const pulpits = await db.collection("pulpit").find({}).toArray();
        sendResponse(res, 200, pulpits);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to fetch pulpits" });
      }
    }

    // POST /api/pulpits
    else if (pathname === "/api/pulpits" && method === "POST") {
      try {
        const body = await parseBody(req);
        const { pulpit, pulpit_name, faculty } = body;

        // проверки
        if (!pulpit || !pulpit_name || !faculty) {
          return sendResponse(res, 400, {
            error: "Missing required fields: pulpit, pulpit_name, faculty",
          });
        }

        const existingPulpit = await db.collection("pulpit").findOne({ pulpit });
        if (existingPulpit) {
          return sendResponse(res, 409, {
            error: `Pulpit with code '${pulpit}' already exists`,
          });
        }

        const facultyExists = await db.collection("faculty").findOne({ faculty });
        if (!facultyExists) {
          return sendResponse(res, 400, {
            error: `Faculty with code '${faculty}' does not exist`,
          });
        }

        // вставка данных
        const newPulpit = { pulpit, pulpit_name, faculty };
        const result = await db.collection("pulpit").insertOne(newPulpit);

        newPulpit._id = result.insertedId;
        sendResponse(res, 201, newPulpit);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to create pulpit" });
      }
    }

    // PUT /api/pulpits
    else if (pathname === "/api/pulpits" && method === "PUT") {
      try {
        const body = await parseBody(req);
        const { pulpit, pulpit_name, faculty } = body;

        if (!pulpit) {
          return sendResponse(res, 400, {
            error: "Pulpit code is required",
          });
        }

        const existingPulpit = await db.collection("pulpit").findOne({ pulpit });
        if (!existingPulpit) {
          return sendResponse(res, 404, {
            error: `Pulpit with code '${pulpit}' not found`,
          });
        }

        const updateData = {};
        
        if (pulpit_name !== undefined) {
          if (pulpit_name.trim() === "") {
            return sendResponse(res, 400, {
              error: "Pulpit name cannot be empty",
            });
          }
          updateData.pulpit_name = pulpit_name;
        }
        
        if (faculty !== undefined) {
          // Проверяем существование нового факультета
          const facultyExists = await db.collection("faculty").findOne({ faculty });
          if (!facultyExists) {
            return sendResponse(res, 400, {
              error: `Faculty with code '${faculty}' does not exist`,
            });
          }
          updateData.faculty = faculty;
        }

        // Проверяем, есть ли изменения
        if (Object.keys(updateData).length === 0) {
          return sendResponse(res, 400, {
            error: "No data provided for update",
          });
        }

        const result = await db
          .collection("pulpit")
          .updateOne({ pulpit }, { $set: updateData });

        const updatedPulpit = await db.collection("pulpit").findOne({ pulpit });
        sendResponse(res, 200, updatedPulpit);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to update pulpit" });
      }
    }

    // DELETE /api/pulpits/:code
    else if (pathname.startsWith("/api/pulpits/") && method === "DELETE") {
      try {
        const code = decodeURIComponent(pathname.split("/")[3]);

        const pulpitToDelete = await db
          .collection("pulpit")
          .findOne({ pulpit: code });
        if (!pulpitToDelete) {
          return sendResponse(res, 404, {
            error: `Pulpit with code '${code}' not found`,
          });
        }

        const result = await db.collection("pulpit").deleteOne({ pulpit: code });
        sendResponse(res, 200, pulpitToDelete);
      } catch (error) {
        sendResponse(res, 500, { error: "Failed to delete pulpit" });
      }
    }

    else {
      sendResponse(res, 404, { error: "Route not found" });
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    sendResponse(res, 500, { error: "Internal server error" });
  }
}

async function startServer() {
  try {
    await connectToDatabase();

    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.on("SIGINT", () => {
      console.log("\nShutting down server...");
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();