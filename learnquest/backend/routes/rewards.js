const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

router.get("/", requireAuth("child"), asyncRoute(async (req, res) => {
  const child = await db.one("SELECT language, coins FROM children WHERE id = ?", [req.user.id]);
  if (!child) return res.status(404).json({ error: "Child not found" });

  const rewards = await db.all("SELECT * FROM rewards ORDER BY cost_coins ASC, name_en ASC");
  const ownedRows = await db.all("SELECT reward_id FROM child_rewards WHERE child_id = ?", [req.user.id]);
  const owned = new Set(ownedRows.map((r) => r.reward_id));
  const lang = ["en", "hi", "mr"].includes(child.language) ? child.language : "en";

  res.json({
    rewards: rewards.map((r) => ({
      id: r.id,
      name: r[`name_${lang}`] || r.name_en,
      type: r.type,
      cost_coins: Number(r.cost_coins || 0),
      emoji: r.emoji,
      owned: owned.has(r.id),
    })),
    coins: Number(child.coins || 0),
  });
}));

router.post("/:id/unlock", requireAuth("child"), asyncRoute(async (req, res) => {
  const result = await db.transaction(async (tx) => {
    const reward = await tx.one("SELECT * FROM rewards WHERE id = ?", [req.params.id]);
    if (!reward) {
      const err = new Error("Reward not found"); err.status = 404; throw err;
    }

    const alreadyOwned = await tx.one(
      "SELECT id FROM child_rewards WHERE child_id = ? AND reward_id = ?",
      [req.user.id, reward.id]
    );
    if (alreadyOwned) {
      const err = new Error("Already owned"); err.status = 409; throw err;
    }

    const child = await tx.one("SELECT coins FROM children WHERE id = ?", [req.user.id]);
    if (!child) { const err = new Error("Child not found"); err.status = 404; throw err; }
    if (Number(child.coins || 0) < Number(reward.cost_coins || 0)) {
      const err = new Error("Not enough coins"); err.status = 400; throw err;
    }

    await tx.run("UPDATE children SET coins = coins - ? WHERE id = ?", [Number(reward.cost_coins), req.user.id]);
    await tx.run(
      "INSERT INTO child_rewards (id, child_id, reward_id) VALUES (?, ?, ?)",
      [`cr_${nanoid(10)}`, req.user.id, reward.id]
    );
    const updated = await tx.one("SELECT coins FROM children WHERE id = ?", [req.user.id]);
    return { ok: true, newCoins: Number(updated.coins || 0) };
  });

  res.json(result);
}));

module.exports = router;
