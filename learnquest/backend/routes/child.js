const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

router.get("/me", requireAuth("child"), asyncRoute(async (req, res) => {
  const child = await db.one("SELECT * FROM children WHERE id = ?", [req.user.id]);
  if (!child) return res.status(404).json({ error: "Child not found" });

  const worlds = await db.all("SELECT * FROM worlds ORDER BY sort_order");
  const levels = await db.all("SELECT * FROM game_levels WHERE world_id = ? ORDER BY level_number", ["jungle"]);
  const progress = await db.all("SELECT * FROM child_level_progress WHERE child_id = ?", [child.id]);
  const progressByLevel = Object.fromEntries(progress.map((p) => [p.level_id, p.status]));

  const levelsWithStatus = levels.map((level) => ({
    ...level,
    is_boss: Number(level.is_boss || 0),
    questions_required: Number(level.questions_required || 0),
    boss_hp: level.boss_hp == null ? null : Number(level.boss_hp),
    status: progressByLevel[level.id] || "locked",
  }));

  res.json({
    child: {
      id: child.id,
      name: child.name,
      age: Number(child.age),
      age_group: child.age_group,
      language: child.language,
      avatar: child.avatar,
      xp: Number(child.xp || 0),
      coins: Number(child.coins || 0),
      overall_level: Number(child.overall_level || 1),
      streak_count: Number(child.streak_count || 0),
    },
    worlds: worlds.map((w) => ({ ...w, is_active: Number(w.is_active || 0), sort_order: Number(w.sort_order || 0) })),
    jungleLevels: levelsWithStatus,
  });
}));

router.put("/me", requireAuth("child"), asyncRoute(async (req, res) => {
  const fields = [];
  const values = [];
  if (["en", "hi", "mr"].includes(req.body?.language)) {
    fields.push("language = ?");
    values.push(req.body.language);
  }
  if (req.body?.avatar) {
    fields.push("avatar = ?");
    values.push(String(req.body.avatar).slice(0, 32));
  }
  if (fields.length === 0) return res.status(400).json({ error: "Nothing to update" });

  values.push(req.user.id);
  await db.run(`UPDATE children SET ${fields.join(", ")} WHERE id = ?`, values);
  res.json({ ok: true });
}));

module.exports = router;
