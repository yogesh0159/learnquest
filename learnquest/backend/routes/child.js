const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

// ---------- GET CHILD PROFILE + DASHBOARD SUMMARY ----------
router.get("/me", requireAuth("child"), (req, res) => {
  const child = db.prepare("SELECT * FROM children WHERE id = ?").get(req.user.id);
  if (!child) return res.status(404).json({ error: "Child not found" });

  const worlds = db.prepare("SELECT * FROM worlds ORDER BY sort_order").all();
  const levels = db.prepare("SELECT * FROM game_levels WHERE world_id = 'jungle' ORDER BY level_number").all();
  const progress = db.prepare("SELECT * FROM child_level_progress WHERE child_id = ?").all(child.id);
  const progressByLevel = Object.fromEntries(progress.map((p) => [p.level_id, p.status]));

  const levelsWithStatus = levels.map((l) => ({
    ...l,
    status: progressByLevel[l.id] || "locked",
  }));

  res.json({
    child: {
      id: child.id, name: child.name, age: child.age, age_group: child.age_group,
      language: child.language, avatar: child.avatar, xp: child.xp, coins: child.coins,
      overall_level: child.overall_level, streak_count: child.streak_count,
    },
    worlds,
    jungleLevels: levelsWithStatus,
  });
});

// ---------- UPDATE LANGUAGE / AVATAR ----------
router.put("/me", requireAuth("child"), (req, res) => {
  const { language, avatar } = req.body;
  const fields = [];
  const values = [];
  if (language) { fields.push("language = ?"); values.push(language); }
  if (avatar) { fields.push("avatar = ?"); values.push(avatar); }
  if (fields.length === 0) return res.status(400).json({ error: "Nothing to update" });
  values.push(req.user.id);
  db.prepare(`UPDATE children SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

module.exports = router;
