const express = require("express");
const db = require("../db");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/questions?subject=maths&count=3
// Returns questions matched to the logged-in child's age group.
// Options are shuffled and correct_index is withheld (answers are checked server-side).
router.get("/", requireAuth("child"), (req, res) => {
  const { subject, count = 3 } = req.query;
  if (!subject) return res.status(400).json({ error: "subject query param required" });

  const child = db.prepare("SELECT age_group, language FROM children WHERE id = ?").get(req.user.id);
  const rows = db.prepare(
    "SELECT * FROM questions WHERE subject_id = ? AND age_group = ?"
  ).all(subject, child.age_group);

  const wanted = Number(count);
  let picked;
  if (rows.length === 0) {
    picked = [];
  } else if (rows.length >= wanted) {
    picked = shuffle(rows).slice(0, wanted);
  } else {
    // Demo question bank is intentionally small; sample with replacement
    // (reshuffling each lap) so Boss Battles that need more correct answers
    // than there are unique questions can still be played. A production
    // deployment should simply seed enough questions per subject/age group.
    picked = [];
    while (picked.length < wanted) {
      picked.push(...shuffle(rows));
    }
    picked = picked.slice(0, wanted);
  }
  const lang = child.language;

  const payload = picked.map((q) => {
    const options = JSON.parse(q.options_json);
    return {
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q[`question_${lang}`] || q.question_en,
      options,
      xp_reward: q.xp_reward,
      // correct_index intentionally omitted
    };
  });

  res.json({ questions: payload });
});

module.exports = router;
