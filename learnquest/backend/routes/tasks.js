const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

// GET /api/tasks/mine -> child views their pending tasks
router.get("/mine", requireAuth("child"), (req, res) => {
  const tasks = db.prepare(
    "SELECT * FROM parent_tasks WHERE child_id = ? ORDER BY created_at DESC"
  ).all(req.user.id);
  res.json({ tasks });
});

// POST /api/tasks/:id/complete -> child marks a task done, reward is granted
router.post("/:id/complete", requireAuth("child"), (req, res) => {
  const task = db.prepare("SELECT * FROM parent_tasks WHERE id = ? AND child_id = ?").get(
    req.params.id, req.user.id
  );
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (task.status === "completed") return res.status(409).json({ error: "Already completed" });

  db.prepare("UPDATE parent_tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(task.id);

  if (task.reward_type === "coins") {
    db.prepare("UPDATE children SET coins = coins + ? WHERE id = ?").run(task.reward_value, req.user.id);
  }
  // 'unlock_time' rewards (e.g. extra Adventure Mode minutes) are surfaced to the
  // frontend as a flag; enforcing play-time limits is a Phase 9+ concern.

  const updated = db.prepare("SELECT coins FROM children WHERE id = ?").get(req.user.id);
  res.json({ ok: true, newCoins: updated.coins });
});

module.exports = router;
