require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const childRoutes = require("./routes/child");
const questionRoutes = require("./routes/questions");
const gameRoutes = require("./routes/game");
const rewardRoutes = require("./routes/rewards");
const parentRoutes = require("./routes/parent");
const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// serve the frontend as static files too, so the whole app runs from one server
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/child", childRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "learnquest-api" }));

app.listen(PORT, () => {
  console.log(`🌳 LearnQuest API running on http://localhost:${PORT}`);
});
