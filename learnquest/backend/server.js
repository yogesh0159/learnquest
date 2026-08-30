require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db");
const seedDatabase = require("./db/seed");
const authRoutes = require("./routes/auth");
const childRoutes = require("./routes/child");
const questionRoutes = require("./routes/questions");
const gameRoutes = require("./routes/game");
const rewardRoutes = require("./routes/rewards");
const parentRoutes = require("./routes/parent");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const frontendDir = path.join(__dirname, "..", "frontend");

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(express.static(frontendDir));

app.use("/api/auth", authRoutes);
app.use("/api/child", childRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await db.ping();
    res.json({ ok: true, service: "learnquest-api", database: db.getDialect() });
  } catch (err) {
    res.status(503).json({ ok: false, service: "learnquest-api", database: db.getDialect(), error: "Database unavailable" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(frontendDir, "index.html")));

app.use("/api", (req, res) => res.status(404).json({ error: "API route not found" }));

app.use((err, req, res, next) => {
  console.error("❌ Request error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
});

let server;

async function start() {
  await db.init();
  await seedDatabase();

  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is not set. The app will run with the development secret; set JWT_SECRET in Railway for production.");
  }

  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌳 LearnQuest running on port ${PORT}`);
    console.log(`🎮 Frontend: /  |  API health: /api/health`);
  });
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  console.error("❌ LearnQuest failed to start:", err);
  process.exit(1);
});
