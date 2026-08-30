const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

function assertOwnsChild(parentId, childId) {
  return db.prepare("SELECT id FROM children WHERE id = ? AND parent_id = ?").get(childId, parentId);
}

// GET /api/parent/dashboard/:childId
router.get("/dashboard/:childId", requireAuth("parent"), (req, res) => {
  const child = assertOwnsChild(req.user.id, req.params.childId);
  if (!child) return res.status(403).json({ error: "Not your child profile" });

  const childRow = db.prepare("SELECT * FROM children WHERE id = ?").get(req.params.childId);

  // accuracy + attempts per subject
  const subjectStats = db.prepare(`
    SELECT s.id as subject_id, s.name_en,
      COUNT(ql.id) as attempted,
      SUM(ql.correct) as correct
    FROM question_log ql
    JOIN questions q ON q.id = ql.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ql.child_id = ?
    GROUP BY s.id
  `).all(req.params.childId);

  // weak topics: topics with < 60% accuracy and at least 2 attempts
  const topicStats = db.prepare(`
    SELECT q.topic, s.name_en as subject,
      COUNT(ql.id) as attempted,
      SUM(ql.correct) as correct
    FROM question_log ql
    JOIN questions q ON q.id = ql.question_id
    JOIN subjects s ON s.id = q.subject_id
    WHERE ql.child_id = ?
    GROUP BY q.topic
    HAVING attempted >= 2
  `).all(req.params.childId);

  const weakTopics = topicStats
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.attempted) * 100) }))
    .filter((t) => t.accuracy < 60);

  const last7 = db.prepare(`
    SELECT * FROM daily_activity WHERE child_id = ?
    ORDER BY activity_date DESC LIMIT 7
  `).all(req.params.childId);

  const totalAttempted = subjectStats.reduce((s, r) => s + r.attempted, 0);
  const totalCorrect = subjectStats.reduce((s, r) => s + (r.correct || 0), 0);

  res.json({
    child: {
      id: childRow.id, name: childRow.name, age: childRow.age, language: childRow.language,
      xp: childRow.xp, coins: childRow.coins, overall_level: childRow.overall_level,
      streak_count: childRow.streak_count,
    },
    overallAccuracy: totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : null,
    subjectStats: subjectStats.map((s) => ({
      subject: s.name_en,
      attempted: s.attempted,
      correct: s.correct || 0,
      accuracy: s.attempted ? Math.round(((s.correct || 0) / s.attempted) * 100) : null,
    })),
    weakTopics,
    last7Days: last7,
  });
});

// POST /api/parent/tasks -> create a custom task for a child
router.post("/tasks", requireAuth("parent"), (req, res) => {
  const { childId, title, description, rewardType, rewardValue } = req.body;
  if (!assertOwnsChild(req.user.id, childId)) return res.status(403).json({ error: "Not your child profile" });
  if (!title) return res.status(400).json({ error: "title is required" });

  const id = `task_${nanoid(10)}`;
  db.prepare(`
    INSERT INTO parent_tasks (id, parent_id, child_id, title, description, reward_type, reward_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, childId, title, description || "", rewardType || "coins", rewardValue || 0);

  res.json({ ok: true, taskId: id });
});

// GET /api/parent/tasks/:childId -> list tasks (parent view)
router.get("/tasks/:childId", requireAuth("parent"), (req, res) => {
  if (!assertOwnsChild(req.user.id, req.params.childId)) return res.status(403).json({ error: "Not your child profile" });
  const tasks = db.prepare("SELECT * FROM parent_tasks WHERE child_id = ? ORDER BY created_at DESC").all(req.params.childId);
  res.json({ tasks });
});

module.exports = router;
