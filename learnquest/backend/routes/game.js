const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function bumpStreak(child) {
  const today = todayStr();
  if (child.last_active_date === today) return child.streak_count; // already counted today
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = child.last_active_date === yesterday ? child.streak_count + 1 : 1;
  db.prepare("UPDATE children SET streak_count = ?, last_active_date = ? WHERE id = ?").run(
    newStreak, today, child.id
  );
  return newStreak;
}

function logDailyActivity(childId, attempted, correct) {
  const date = todayStr();
  const existing = db.prepare(
    "SELECT * FROM daily_activity WHERE child_id = ? AND activity_date = ?"
  ).get(childId, date);
  if (existing) {
    db.prepare(`
      UPDATE daily_activity SET questions_attempted = questions_attempted + ?, questions_correct = questions_correct + ?
      WHERE id = ?
    `).run(attempted, correct, existing.id);
  } else {
    db.prepare(`
      INSERT INTO daily_activity (id, child_id, activity_date, questions_attempted, questions_correct)
      VALUES (?, ?, ?, ?, ?)
    `).run(`da_${nanoid(10)}`, childId, date, attempted, correct);
  }
}

// POST /api/game/gate/attempt
// body: { levelId, answers: [{ questionId, selectedIndex }] }
// Works for both a normal Knowledge Gate and a Boss Battle (level.is_boss = 1).
router.post("/gate/attempt", requireAuth("child"), (req, res) => {
  const { levelId, answers } = req.body;
  if (!levelId || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "levelId and answers[] are required" });
  }

  const level = db.prepare("SELECT * FROM game_levels WHERE id = ?").get(levelId);
  if (!level) return res.status(404).json({ error: "Level not found" });

  const child = db.prepare("SELECT * FROM children WHERE id = ?").get(req.user.id);

  let correctCount = 0;
  let xpEarned = 0;
  const results = [];

  for (const a of answers) {
    const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(a.questionId);
    if (!q) continue;
    const isCorrect = Number(a.selectedIndex) === q.correct_index;
    if (isCorrect) {
      correctCount += 1;
      xpEarned += q.xp_reward;
    }
    db.prepare(`
      INSERT INTO question_log (id, child_id, question_id, level_id, correct)
      VALUES (?, ?, ?, ?, ?)
    `).run(`ql_${nanoid(10)}`, child.id, q.id, level.id, isCorrect ? 1 : 0);

    results.push({
      questionId: q.id,
      correct: isCorrect,
      correctIndex: q.correct_index,
      explanation: q[`explanation_${child.language}`] || q.explanation_en,
    });
  }

  logDailyActivity(child.id, answers.length, correctCount);

  const requiredCorrect = level.is_boss ? level.boss_hp : level.questions_required;
  const passed = correctCount >= requiredCorrect;

  let bonusXp = 0;
  let bonusCoins = 0;
  let newlyUnlockedLevelId = null;

  if (passed) {
    bonusXp = level.is_boss ? 200 : 100; // full level completion bonus / boss bonus
    bonusCoins = level.is_boss ? 300 : 50;

    // mark this level completed
    db.prepare(`
      INSERT INTO child_level_progress (id, child_id, level_id, status, attempts, completed_at)
      VALUES (?, ?, ?, 'completed', 1, datetime('now'))
      ON CONFLICT(child_id, level_id) DO UPDATE SET
        status = 'completed', attempts = attempts + 1, completed_at = datetime('now')
    `).run(`clp_${nanoid(10)}`, child.id, level.id);

    // unlock next level in the same world, if any
    const nextLevel = db.prepare(
      "SELECT * FROM game_levels WHERE world_id = ? AND level_number = ?"
    ).get(level.world_id, level.level_number + 1);

    if (nextLevel) {
      db.prepare(`
        INSERT INTO child_level_progress (id, child_id, level_id, status)
        VALUES (?, ?, ?, 'unlocked')
        ON CONFLICT(child_id, level_id) DO UPDATE SET
          status = CASE WHEN status = 'locked' THEN 'unlocked' ELSE status END
      `).run(`clp_${nanoid(10)}`, child.id, nextLevel.id);
      newlyUnlockedLevelId = nextLevel.id;
    }
  } else {
    // record attempt, keep as unlocked (not completed) so the child can retry
    db.prepare(`
      INSERT INTO child_level_progress (id, child_id, level_id, status, attempts)
      VALUES (?, ?, ?, 'unlocked', 1)
      ON CONFLICT(child_id, level_id) DO UPDATE SET attempts = attempts + 1
    `).run(`clp_${nanoid(10)}`, child.id, level.id);
  }

  const totalXp = xpEarned + bonusXp;
  const totalCoins = bonusCoins;

  db.prepare("UPDATE children SET xp = xp + ?, coins = coins + ? WHERE id = ?").run(
    totalXp, totalCoins, child.id
  );

  // simple overall level formula: 1 level per 200 XP
  const updated = db.prepare("SELECT xp, coins FROM children WHERE id = ?").get(child.id);
  const overallLevel = Math.max(1, Math.floor(updated.xp / 200) + 1);
  db.prepare("UPDATE children SET overall_level = ? WHERE id = ?").run(overallLevel, child.id);

  const streak = bumpStreak(child);

  res.json({
    passed,
    correctCount,
    requiredCorrect,
    results,
    xpEarned: totalXp,
    coinsEarned: totalCoins,
    newXp: updated.xp,
    newCoins: updated.coins,
    overallLevel,
    streak,
    newlyUnlockedLevelId,
    bossHpRemaining: level.is_boss ? Math.max(0, level.boss_hp - correctCount) : null,
  });
});

module.exports = router;
