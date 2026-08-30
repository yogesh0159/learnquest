const express = require("express");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const db = require("../db");
const { signToken, requireAuth } = require("../utils/auth");

const router = express.Router();

function ageGroupFor(age) {
  if (age >= 4 && age <= 6) return "4-6";
  if (age >= 7 && age <= 9) return "7-9";
  if (age >= 10 && age <= 12) return "10-12";
  return "7-9"; // fallback
}

// ---------- PARENT SIGNUP ----------
router.post("/parent/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }
  const existing = db.prepare("SELECT id FROM parents WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const id = `parent_${nanoid(10)}`;
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO parents (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    id, name, email, password_hash
  );
  const token = signToken({ id, role: "parent", name });
  res.json({ token, parent: { id, name, email } });
});

// ---------- PARENT LOGIN ----------
router.post("/parent/login", (req, res) => {
  const { email, password } = req.body;
  const parent = db.prepare("SELECT * FROM parents WHERE email = ?").get(email);
  if (!parent || !bcrypt.compareSync(password, parent.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken({ id: parent.id, role: "parent", name: parent.name });
  res.json({ token, parent: { id: parent.id, name: parent.name, email: parent.email } });
});

// ---------- CREATE CHILD PROFILE (parent must be logged in) ----------
router.post("/child/create", requireAuth("parent"), (req, res) => {
  const { name, age, language, avatar, pin, className } = req.body;
  if (!name || !age || !language || !avatar || !pin) {
    return res.status(400).json({ error: "name, age, language, avatar, pin are required" });
  }
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: "pin must be exactly 4 digits" });
  }
  const id = `child_${nanoid(10)}`;
  const age_group = ageGroupFor(Number(age));
  db.prepare(`
    INSERT INTO children (id, parent_id, name, age, age_group, class, language, avatar, pin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, age, age_group, className || null, language, avatar, pin);

  // unlock level 1 of Jungle World by default
  const level1 = db.prepare("SELECT id FROM game_levels WHERE world_id='jungle' AND level_number=1").get();
  if (level1) {
    db.prepare(`
      INSERT OR IGNORE INTO child_level_progress (id, child_id, level_id, status)
      VALUES (?, ?, ?, 'unlocked')
    `).run(`clp_${nanoid(10)}`, id, level1.id);
  }

  res.json({ child: { id, name, age, age_group, language, avatar } });
});

// ---------- LIST CHILDREN FOR A PARENT ----------
router.get("/child/list", requireAuth("parent"), (req, res) => {
  const children = db.prepare(
    "SELECT id, name, age, age_group, language, avatar, xp, coins, overall_level, streak_count FROM children WHERE parent_id = ?"
  ).all(req.user.id);
  res.json({ children });
});

// ---------- CHILD LOGIN (child id + 4-digit PIN, no email needed) ----------
router.post("/child/login", (req, res) => {
  const { childId, pin } = req.body;
  const child = db.prepare("SELECT * FROM children WHERE id = ?").get(childId);
  if (!child || child.pin !== pin) {
    return res.status(401).json({ error: "Invalid child ID or PIN" });
  }
  const token = signToken({ id: child.id, role: "child", name: child.name, parentId: child.parent_id });
  res.json({
    token,
    child: {
      id: child.id, name: child.name, age: child.age, age_group: child.age_group,
      language: child.language, avatar: child.avatar, xp: child.xp, coins: child.coins,
      overall_level: child.overall_level, streak_count: child.streak_count,
    },
  });
});

module.exports = router;
