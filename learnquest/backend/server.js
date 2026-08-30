require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const db = require("./db");
const seedDatabase = require("./db/seed");
const logger = require("./utils/logger");
const { apiLimiter } = require("./utils/rate-limit");
const authRoutes = require("./routes/auth");
const childRoutes = require("./routes/child");
const questionRoutes = require("./routes/questions");
const gameRoutes = require("./routes/game");
const rewardRoutes = require("./routes/rewards");
const parentRoutes = require("./routes/parent");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const isProd = process.env.NODE_ENV === "production";
const frontendDir = path.join(__dirname, "..", "frontend");

// Railway (and most PaaS) sit behind a reverse proxy — trust the first hop so
// req.ip / rate-limiting see the real client IP instead of the proxy's.
app.set("trust proxy", 1);

app.disable("x-powered-by");

// Security headers. The frontend still uses inline <script> blocks on
// several pages, so script-src/style-src allow 'unsafe-inline' for now
// rather than breaking the app — tightening this further (nonces/hashes)
// is a good follow-up once inline scripts are extracted to files.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: same-origin by default (frontend is served by this same Express app).
// Set ALLOWED_ORIGINS (comma-separated) if the frontend is ever hosted
// separately from the API.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / server-to-server / curl
      if (!isProd || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(compression());
app.use(express.json({ limit: "256kb" }));
app.use("/api", apiLimiter);

// Serve the installed Three.js module locally so the 3D runner does not depend on a public CDN.
app.use("/vendor/three", express.static(path.join(__dirname, "node_modules", "three", "build"), { maxAge: "7d", immutable: true }));

// Static frontend: long-lived cache for versioned/library assets, short/no
// cache for HTML so deploys are picked up immediately by returning clients.
app.use(
  express.static(frontendDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({ method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start }, "request");
  });
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/child", childRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", async (req, res) => {
  const startedAt = Date.now();
  try {
    await db.ping();
    res.json({ ok: true, service: "learnquest-api", database: db.getDialect(), dbLatencyMs: Date.now() - startedAt });
  } catch (err) {
    res.status(503).json({ ok: false, service: "learnquest-api", database: db.getDialect(), error: "Database unavailable" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(frontendDir, "index.html")));

app.use("/api", (req, res) => res.status(404).json({ error: "API route not found" }));

app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack, path: req.originalUrl }, "Request error");
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Internal server error" });
});

let server;

async function start() {
  await db.init();
  await seedDatabase();

  server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🌳 LearnQuest running on port ${PORT}`);
    logger.info(`🎮 Frontend: /  |  API health: /api/health`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  logger.error({ err: err.message, stack: err.stack }, "LearnQuest failed to start");
  process.exit(1);
});
