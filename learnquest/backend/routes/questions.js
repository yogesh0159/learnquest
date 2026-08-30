const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");
const asyncRoute = require("../utils/async-route");

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function localizeOption(option, lang) {
  if (option && typeof option === "object") {
    return option[lang] || option.en || Object.values(option)[0] || "";
  }
  return String(option ?? "");
}

router.get("/", requireAuth("child"), asyncRoute(async (req, res) => {
  const subject = String(req.query.subject || "").trim();
  const wanted = Math.min(10, Math.max(1, Number(req.query.count || 3)));
  const runnerMode = String(req.query.runner || "") === "1";
  if (!subject) return res.status(400).json({ error: "subject query param required" });

  const child = await db.one("SELECT age_group, language FROM children WHERE id = ?", [req.user.id]);
  if (!child) return res.status(404).json({ error: "Child not found" });

  const rows = await db.all(
    "SELECT * FROM questions WHERE subject_id = ? AND age_group = ?",
    [subject, child.age_group]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "No questions available for this subject and age group" });
  }

  const picked = shuffle(rows).slice(0, Math.min(wanted, rows.length));
  const lang = ["en", "hi", "mr"].includes(child.language) ? child.language : "en";

  const payload = picked.map((q) => {
    const rawOptions = JSON.parse(q.options_json);
    const localized = rawOptions.map((option) => localizeOption(option, lang));

    if (runnerMode) {
      const correctIndex = Number(q.correct_index);
      const wrongIndexes = localized.map((_, index) => index).filter((index) => index !== correctIndex);
      const chosenIndexes = shuffle([correctIndex, ...shuffle(wrongIndexes).slice(0, 2)]);
      return {
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q[`question_${lang}`] || q.question_en,
        options: chosenIndexes.map((originalIndex) => ({
          text: localized[originalIndex],
          originalIndex,
        })),
        xp_reward: Number(q.xp_reward || 0),
      };
    }

    return {
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q[`question_${lang}`] || q.question_en,
      options: localized,
      xp_reward: Number(q.xp_reward || 0),
    };
  });

  res.json({ questions: payload, mode: runnerMode ? "runner" : "standard" });
}));

module.exports = router;
