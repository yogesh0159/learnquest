const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

router.get("/mine", requireAuth("child"), asyncRoute(async (req, res) => {
  const tasks = await db.all(
    "SELECT * FROM parent_tasks WHERE child_id = ? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ tasks });
}));

router.post("/:id/complete", requireAuth("child"), asyncRoute(async (req, res) => {
  const result = await db.transaction(async (tx) => {
    const task = await tx.one(
      "SELECT * FROM parent_tasks WHERE id = ? AND child_id = ?",
      [req.params.id, req.user.id]
    );
    if (!task) { const err = new Error("Task not found"); err.status = 404; throw err; }
    if (task.status === "completed") { const err = new Error("Already completed"); err.status = 409; throw err; }

    await tx.run(
      "UPDATE parent_tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
      ["completed", task.id]
    );

    if (task.reward_type === "coins") {
      await tx.run("UPDATE children SET coins = coins + ? WHERE id = ?", [Number(task.reward_value || 0), req.user.id]);
    }

    const updated = await tx.one("SELECT coins FROM children WHERE id = ?", [req.user.id]);
    return { ok: true, newCoins: Number(updated?.coins || 0) };
  });

  res.json(result);
}));

module.exports = router;
