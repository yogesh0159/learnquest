const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

// GET /api/rewards -> shop catalog + which ones this child already owns
router.get("/", requireAuth("child"), (req, res) => {
  const child = db.prepare("SELECT language, coins FROM children WHERE id = ?").get(req.user.id);
  const rewards = db.prepare("SELECT * FROM rewards").all();
  const owned = new Set(
    db.prepare("SELECT reward_id FROM child_rewards WHERE child_id = ?").all(req.user.id)
      .map((r) => r.reward_id)
  );
  const lang = child.language;
  const payload = rewards.map((r) => ({
    id: r.id,
    name: r[`name_${lang}`] || r.name_en,
    type: r.type,
    cost_coins: r.cost_coins,
    emoji: r.emoji,
    owned: owned.has(r.id),
  }));
  res.json({ rewards: payload, coins: child.coins });
});

// POST /api/rewards/:id/unlock -> spend coins to unlock a reward item
router.post("/:id/unlock", requireAuth("child"), (req, res) => {
  const reward = db.prepare("SELECT * FROM rewards WHERE id = ?").get(req.params.id);
  if (!reward) return res.status(404).json({ error: "Reward not found" });

  const alreadyOwned = db.prepare(
    "SELECT id FROM child_rewards WHERE child_id = ? AND reward_id = ?"
  ).get(req.user.id, reward.id);
  if (alreadyOwned) return res.status(409).json({ error: "Already owned" });

  const child = db.prepare("SELECT coins FROM children WHERE id = ?").get(req.user.id);
  if (child.coins < reward.cost_coins) {
    return res.status(400).json({ error: "Not enough coins" });
  }

  db.prepare("UPDATE children SET coins = coins - ? WHERE id = ?").run(reward.cost_coins, req.user.id);
  db.prepare(
    "INSERT INTO child_rewards (id, child_id, reward_id) VALUES (?, ?, ?)"
  ).run(`cr_${nanoid(10)}`, req.user.id, reward.id);

  const updated = db.prepare("SELECT coins FROM children WHERE id = ?").get(req.user.id);
  res.json({ ok: true, newCoins: updated.coins });
});

module.exports = router;
