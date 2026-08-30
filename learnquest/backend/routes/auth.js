const express = require("express");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const db = require("../db");
const { signToken, requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

function ageGroupFor(age) {
  if (age >= 4 && age <= 6) return "4-6";
  if (age >= 7 && age <= 9) return "7-9";
  if (age >= 10 && age <= 12) return "10-12";
  return null;
}

router.post("/parent/signup", asyncRoute(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await db.one("SELECT id FROM parents WHERE email = ?", [email]);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const id = `parent_${nanoid(10)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  await db.run(
    "INSERT INTO parents (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    [id, name, email, passwordHash]
  );

  const token = signToken({ id, role: "parent", name });
  res.status(201).json({ token, parent: { id, name, email } });
}));

router.post("/parent/login", asyncRoute(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const parent = await db.one("SELECT * FROM parents WHERE email = ?", [email]);

  if (!parent || !(await bcrypt.compare(password, parent.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ id: parent.id, role: "parent", name: parent.name });
  res.json({ token, parent: { id: parent.id, name: parent.name, email: parent.email } });
}));

router.post("/child/create", requireAuth("parent"), asyncRoute(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const age = Number(req.body?.age);
  const language = ["en", "hi", "mr"].includes(req.body?.language) ? req.body.language : "en";
  const avatar = String(req.body?.avatar || "🦊").slice(0, 32);
  const pin = String(req.body?.pin || "").trim();
  const className = String(req.body?.className || "").trim();
  const ageGroup = ageGroupFor(age);

  if (!name || !ageGroup || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: "Valid name, age (4-12), and a 4-digit PIN are required" });
  }

  const id = `child_${nanoid(10)}`;
  await db.transaction(async (tx) => {
    await tx.run(`
      INSERT INTO children (id, parent_id, name, age, age_group, class, language, avatar, pin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, name, age, ageGroup, className || null, language, avatar, pin]);

    const level1 = await tx.one("SELECT id FROM game_levels WHERE world_id = ? AND level_number = 1", ["jungle"]);
    if (level1) {
      await tx.run(
        "INSERT INTO child_level_progress (id, child_id, level_id, status) VALUES (?, ?, ?, ?)",
        [`clp_${nanoid(10)}`, id, level1.id, "unlocked"]
      );
    }

    const starterReward = await tx.one("SELECT id FROM rewards WHERE id = ?", ["reward_forest_fox"]);
    if (starterReward) {
      await tx.run(
        "INSERT INTO child_rewards (id, child_id, reward_id) VALUES (?, ?, ?)",
        [`cr_${nanoid(10)}`, id, starterReward.id]
      );
      await tx.run(
        "INSERT INTO child_equipped_rewards (id, child_id, slot, reward_id) VALUES (?, ?, ?, ?)",
        [`cer_${nanoid(10)}`, id, "character", starterReward.id]
      );
    }
  });

  res.status(201).json({ child: { id, name, age, age_group: ageGroup, language, avatar } });
}));

router.get("/child/list", requireAuth("parent"), asyncRoute(async (req, res) => {
  const children = await db.all(
    "SELECT id, name, age, age_group, language, avatar, xp, coins, overall_level, streak_count FROM children WHERE parent_id = ? ORDER BY created_at ASC",
    [req.user.id]
  );
  res.json({ children });
}));

router.post("/child/login", asyncRoute(async (req, res) => {
  const childId = String(req.body?.childId || "").trim();
  const pin = String(req.body?.pin || "").trim();
  const child = await db.one("SELECT * FROM children WHERE id = ?", [childId]);

  if (!child || String(child.pin) !== pin) {
    return res.status(401).json({ error: "Invalid child ID or PIN" });
  }

  const token = signToken({ id: child.id, role: "child", name: child.name, parentId: child.parent_id });
  res.json({
    token,
    child: {
      id: child.id,
      name: child.name,
      age: child.age,
      age_group: child.age_group,
      language: child.language,
      avatar: child.avatar,
      xp: Number(child.xp || 0),
      coins: Number(child.coins || 0),
      overall_level: Number(child.overall_level || 1),
      streak_count: Number(child.streak_count || 0),
    },
  });
}));

module.exports = router;
