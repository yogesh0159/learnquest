const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

async function ownsChild(parentId, childId, dbApi = db) {
  return dbApi.one("SELECT id FROM children WHERE id = ? AND parent_id = ?", [childId, parentId]);
}

router.get("/dashboard/:childId", requireAuth("parent"), asyncRoute(async (req, res) => {
  if (!(await ownsChild(req.user.id, req.params.childId))) {
    return res.status(403).json({ error: "Not your child profile" });
  }

  const childRow = await db.one("SELECT * FROM children WHERE id = ?", [req.params.childId]);
  const subjectStats = await db.all(`
    SELECT s.id AS subject_id, s.name_en,
      COUNT(ql.id) AS attempted,
      COALESCE(SUM(ql.correct), 0) AS correct
    FROM question_log ql
    JOIN questions q ON q.id = ql.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ql.child_id = ?
    GROUP BY s.id, s.name_en
  `, [req.params.childId]);

  const topicStats = await db.all(`
    SELECT q.topic, s.name_en AS subject,
      COUNT(ql.id) AS attempted,
      COALESCE(SUM(ql.correct), 0) AS correct
    FROM question_log ql
    JOIN questions q ON q.id = ql.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ql.child_id = ?
    GROUP BY q.topic, s.name_en
    HAVING COUNT(ql.id) >= 2
  `, [req.params.childId]);

  const weakTopics = topicStats
    .map((row) => {
      const attempted = Number(row.attempted || 0);
      const correct = Number(row.correct || 0);
      return { ...row, attempted, correct, accuracy: attempted ? Math.round((correct / attempted) * 100) : 0 };
    })
    .filter((row) => row.accuracy < 60);

  const last7 = await db.all(`
    SELECT * FROM daily_activity WHERE child_id = ?
    ORDER BY activity_date DESC LIMIT 7
  `, [req.params.childId]);

  const normalizedStats = subjectStats.map((row) => ({
    subject: row.name_en,
    attempted: Number(row.attempted || 0),
    correct: Number(row.correct || 0),
  }));
  const totalAttempted = normalizedStats.reduce((sum, row) => sum + row.attempted, 0);
  const totalCorrect = normalizedStats.reduce((sum, row) => sum + row.correct, 0);

  res.json({
    child: {
      id: childRow.id,
      name: childRow.name,
      age: Number(childRow.age),
      language: childRow.language,
      xp: Number(childRow.xp || 0),
      coins: Number(childRow.coins || 0),
      overall_level: Number(childRow.overall_level || 1),
      streak_count: Number(childRow.streak_count || 0),
    },
    overallAccuracy: totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : null,
    subjectStats: normalizedStats.map((row) => ({
      ...row,
      accuracy: row.attempted ? Math.round((row.correct / row.attempted) * 100) : null,
    })),
    weakTopics,
    last7Days: last7,
  });
}));

router.post("/tasks", requireAuth("parent"), asyncRoute(async (req, res) => {
  const childId = String(req.body?.childId || "");
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const rewardType = "coins";
  const rewardValue = Math.max(0, Math.min(10000, Number(req.body?.rewardValue || 0)));

  if (!(await ownsChild(req.user.id, childId))) return res.status(403).json({ error: "Not your child profile" });
  if (!title) return res.status(400).json({ error: "title is required" });

  const id = `task_${nanoid(10)}`;
  await db.run(`
    INSERT INTO parent_tasks (id, parent_id, child_id, title, description, reward_type, reward_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, req.user.id, childId, title, description, rewardType, rewardValue]);

  res.status(201).json({ ok: true, taskId: id });
}));

router.get("/tasks/:childId", requireAuth("parent"), asyncRoute(async (req, res) => {
  if (!(await ownsChild(req.user.id, req.params.childId))) return res.status(403).json({ error: "Not your child profile" });
  const tasks = await db.all(
    "SELECT * FROM parent_tasks WHERE child_id = ? ORDER BY created_at DESC",
    [req.params.childId]
  );
  res.json({ tasks });
}));

module.exports = router;
