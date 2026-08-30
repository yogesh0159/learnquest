const express = require("express");
const { nanoid } = require("nanoid");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function bumpStreak(tx, child) {
  const today = todayStr();
  if (child.last_active_date === today) return Number(child.streak_count || 0);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = child.last_active_date === yesterday ? Number(child.streak_count || 0) + 1 : 1;
  await tx.run("UPDATE children SET streak_count = ?, last_active_date = ? WHERE id = ?", [newStreak, today, child.id]);
  return newStreak;
}

async function logDailyActivity(tx, childId, attempted, correct) {
  const date = todayStr();
  const existing = await tx.one(
    "SELECT id FROM daily_activity WHERE child_id = ? AND activity_date = ?",
    [childId, date]
  );
  if (existing) {
    await tx.run(`
      UPDATE daily_activity
      SET questions_attempted = questions_attempted + ?, questions_correct = questions_correct + ?
      WHERE id = ?
    `, [attempted, correct, existing.id]);
  } else {
    await tx.run(`
      INSERT INTO daily_activity (id, child_id, activity_date, questions_attempted, questions_correct)
      VALUES (?, ?, ?, ?, ?)
    `, [`da_${nanoid(10)}`, childId, date, attempted, correct]);
  }
}

router.post("/gate/attempt", requireAuth("child"), asyncRoute(async (req, res) => {
  const levelId = String(req.body?.levelId || "").trim();
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const runCoins = Math.min(10, Math.max(0, Number(req.body?.runCoins || 0)));

  if (!levelId || answers.length === 0) {
    return res.status(400).json({ error: "levelId and answers[] are required" });
  }

  const response = await db.transaction(async (tx) => {
    const level = await tx.one("SELECT * FROM game_levels WHERE id = ?", [levelId]);
    if (!level) {
      const err = new Error("Level not found");
      err.status = 404;
      throw err;
    }

    const child = await tx.one("SELECT * FROM children WHERE id = ?", [req.user.id]);
    if (!child) {
      const err = new Error("Child not found");
      err.status = 404;
      throw err;
    }

    const progress = await tx.one(
      "SELECT * FROM child_level_progress WHERE child_id = ? AND level_id = ?",
      [child.id, level.id]
    );
    if (!progress || progress.status === "locked") {
      const err = new Error("This level is locked");
      err.status = 403;
      throw err;
    }

    const uniqueAnswers = [];
    const seen = new Set();
    for (const answer of answers) {
      const questionId = String(answer?.questionId || "");
      if (!questionId || seen.has(questionId)) continue;
      seen.add(questionId);
      uniqueAnswers.push({ questionId, selectedIndex: Number(answer?.selectedIndex) });
    }

    let correctCount = 0;
    let xpFromQuestions = 0;
    const results = [];

    for (const answer of uniqueAnswers) {
      const q = await tx.one("SELECT * FROM questions WHERE id = ?", [answer.questionId]);
      if (!q) continue;
      if (q.subject_id !== level.gate_subject_id || q.age_group !== child.age_group) continue;

      const isCorrect = answer.selectedIndex === Number(q.correct_index);
      if (isCorrect) {
        correctCount += 1;
        xpFromQuestions += Number(q.xp_reward || 0);
      }

      await tx.run(`
        INSERT INTO question_log (id, child_id, question_id, level_id, correct)
        VALUES (?, ?, ?, ?, ?)
      `, [`ql_${nanoid(10)}`, child.id, q.id, level.id, isCorrect ? 1 : 0]);

      const lang = ["en", "hi", "mr"].includes(child.language) ? child.language : "en";
      results.push({
        questionId: q.id,
        correct: isCorrect,
        correctIndex: Number(q.correct_index),
        explanation: q[`explanation_${lang}`] || q.explanation_en,
      });
    }

    if (results.length === 0) {
      const err = new Error("No valid answers were submitted");
      err.status = 400;
      throw err;
    }

    await logDailyActivity(tx, child.id, results.length, correctCount);

    const isBoss = Number(level.is_boss || 0) === 1;
    const configuredRequired = isBoss
      ? Number(level.boss_hp || 5)
      : Math.max(1, Math.ceil(Number(level.questions_required || 3) * 2 / 3));
    const requiredCorrect = Math.min(configuredRequired, results.length);
    const passed = correctCount >= requiredCorrect;
    const wasCompleted = progress.status === "completed";

    let bonusXp = 0;
    let completionCoins = 0;
    let newlyUnlockedLevelId = null;

    if (passed) {
      if (!wasCompleted) {
        bonusXp = isBoss ? 200 : 100;
        completionCoins = isBoss ? 300 : 50;
      }

      await tx.run(
        "UPDATE child_level_progress SET status = ?, attempts = attempts + 1, completed_at = CURRENT_TIMESTAMP WHERE child_id = ? AND level_id = ?",
        ["completed", child.id, level.id]
      );

      const nextLevel = await tx.one(
        "SELECT * FROM game_levels WHERE world_id = ? AND level_number = ?",
        [level.world_id, Number(level.level_number) + 1]
      );

      if (nextLevel) {
        const nextProgress = await tx.one(
          "SELECT * FROM child_level_progress WHERE child_id = ? AND level_id = ?",
          [child.id, nextLevel.id]
        );
        if (!nextProgress) {
          await tx.run(
            "INSERT INTO child_level_progress (id, child_id, level_id, status) VALUES (?, ?, ?, ?)",
            [`clp_${nanoid(10)}`, child.id, nextLevel.id, "unlocked"]
          );
          newlyUnlockedLevelId = nextLevel.id;
        } else if (nextProgress.status === "locked") {
          await tx.run(
            "UPDATE child_level_progress SET status = ? WHERE child_id = ? AND level_id = ?",
            ["unlocked", child.id, nextLevel.id]
          );
          newlyUnlockedLevelId = nextLevel.id;
        }
      }
    } else {
      await tx.run(
        "UPDATE child_level_progress SET attempts = attempts + 1 WHERE child_id = ? AND level_id = ?",
        [child.id, level.id]
      );
    }

    const collectibleCoins = passed ? runCoins : 0;
    const totalXp = xpFromQuestions + bonusXp;
    const totalCoins = completionCoins + collectibleCoins;

    await tx.run("UPDATE children SET xp = xp + ?, coins = coins + ? WHERE id = ?", [totalXp, totalCoins, child.id]);
    const updated = await tx.one("SELECT xp, coins FROM children WHERE id = ?", [child.id]);
    const overallLevel = Math.max(1, Math.floor(Number(updated.xp || 0) / 200) + 1);
    await tx.run("UPDATE children SET overall_level = ? WHERE id = ?", [overallLevel, child.id]);
    const streak = await bumpStreak(tx, child);

    return {
      passed,
      correctCount,
      requiredCorrect,
      results,
      xpEarned: totalXp,
      coinsEarned: totalCoins,
      newXp: Number(updated.xp || 0),
      newCoins: Number(updated.coins || 0),
      overallLevel,
      streak,
      newlyUnlockedLevelId,
      bossHpRemaining: isBoss ? Math.max(0, Number(level.boss_hp || 5) - correctCount) : null,
    };
  });

  res.json(response);
}));

module.exports = router;
