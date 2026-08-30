# LearnQuest — Phase 1–5 Working Prototype

A gamified learning platform for children (ages 4–12) in English, Hindi and
Marathi. This is a **real, runnable app** — not a mockup — covering the core
loop from your roadmap:

```
Sign up → Child Profile → Game Dashboard → Jungle World map
   → 2D adventure game → Knowledge Gate (quiz) → Pass
   → XP + Coins + Level Unlock → Reward Shop / Parent Dashboard
```

## What's implemented (tested end-to-end)

| Phase | Status | Notes |
|---|---|---|
| 1. Login + Child Profile + Dashboard | ✅ Done | Parent auth (JWT), child PIN login, avatar/language picker |
| 2. First Jungle Game | ✅ Done | Real Phaser 2D side-scroller — walk, collect coins, reach the gate |
| 3. Learning Questions | ✅ Done | Age/subject-filtered question engine, 3 languages, 18 seed questions |
| 4. Learning Gate → Level Unlock | ✅ Done | Pass/fail logic, retry, hints via explanations, level unlock chain |
| 5. XP + Coins + Rewards | ✅ Done | XP/coin formulas, reward shop, overall level calculation |
| 6. Parent Dashboard | ✅ Done | Accuracy, subject breakdown, weak topics, streak, custom tasks |
| 7. Hindi + Marathi | ✅ Done | Full UI i18n + bilingual question/explanation content |
| 8. Daily Quest + Boss Battle | 🟡 Partial | Boss Battle works (5-hit HP fight); Daily Quest not yet built |
| 9. AI Adaptive Learning | ⬜ Not started | See roadmap below |
| 10. Multiplayer / School system | ⬜ Not started | See roadmap below |

## Quick start

```bash
cd backend
npm install
npm run seed        # populates subjects, questions, Jungle World levels, rewards
npm start            # → http://localhost:4000
```

Open `http://localhost:4000` in a browser — the Express server serves both
the API (`/api/...`) and the frontend as static files, so there's nothing
else to run.

**Try it:**
1. "I'm a Grown-up" → Sign Up → creates a parent account
2. You'll land on **Create Child Profile** — pick an age (this determines
   question difficulty), language, avatar, and a 4-digit PIN. Note the
   **Child ID** shown after saving.
3. Log out, go to "I'm a Kid — Let's Play!", enter the Child ID + PIN.
4. Dashboard → Jungle World → click an unlocked node → walk right with
   arrow keys (or the on-screen buttons) → hit the gate → answer 3
   questions → level unlocks.
5. Back on the parent side, log back in to see accuracy/weak-topic
   analytics update, and assign a custom task.

## Architecture

```
backend/
  server.js            Express app, mounts all routes + serves frontend/
  db/
    schema.sql          Full schema (see below)
    seed.js              Sample content: 3 subjects × 3 age groups, Jungle
                           World's 10 levels (incl. boss), 7 reward items
  routes/
    auth.js              Parent signup/login, child create/login
    child.js              Child profile + dashboard summary
    questions.js         Age/subject-filtered question fetch
    game.js                Knowledge Gate / Boss Battle attempt + unlock logic
    rewards.js            Reward shop catalog + purchase
    parent.js              Analytics dashboard + task creation
    tasks.js                Child-facing task list + completion
  utils/auth.js         JWT signing + role-based middleware

frontend/                Plain HTML/CSS/JS (no build step, per your own
                          roadmap's "Phase 1" recommendation)
  index.html, parent.html, child-login.html, profile-setup.html,
  dashboard.html, world-jungle.html, jungle-game.html, rewards.html,
  tasks.html, parent-dashboard.html
  css/tokens.css        Design tokens (jungle canopy palette, Baloo 2 +
                          Mukta type pairing — both support Devanagari)
  css/components.css    Buttons, cards, forms, the path-map, quiz modal, etc.
  js/api.js               fetch wrapper + session helpers
  js/i18n.js               Loads locales/*.json, swaps all data-i18n text
  js/gate.js               The Knowledge Gate / Boss Battle quiz modal
  locales/en.json, hi.json, mr.json
```

### Database

Written for **SQLite** so it runs with zero setup (`backend/db/learnquest.sqlite`
is created automatically). The schema in `db/schema.sql` maps directly onto
PostgreSQL for production — swap `AUTOINCREMENT`/`TEXT` timestamp columns for
`SERIAL`/`TIMESTAMP` and point `db/index.js` at a Postgres client instead of
`better-sqlite3`. Tables: `parents`, `children`, `subjects`, `questions`,
`worlds`, `game_levels`, `child_level_progress`, `question_log`, `rewards`,
`child_rewards`, `parent_tasks`, `daily_activity` — this is the structure
your roadmap asked for (child_id, xp, coins, current_game_level, etc.),
just normalized into proper tables instead of one flat record.

### Question bank size (important)

The seed file ships **18 sample questions** (2–3 per subject per age group)
so you can see the whole system work. A real launch needs **hundreds per
age group** — the Boss Battle currently reuses questions (sampling with
replacement) because there aren't enough unique ones yet for a 5-question
fight. Add rows to the `questions` array in `db/seed.js` (same shape, just
more of them) and the app will automatically serve more variety — no code
changes needed elsewhere.

### Security notes for going to production

- Set a real `JWT_SECRET` env var (the code falls back to a dev default).
- Child PINs are stored in plaintext in this prototype for simplicity of
  parent-shares-the-PIN flow — hash them (bcrypt, like parent passwords)
  before shipping.
- Add rate limiting to `/api/auth/*` endpoints.
- The current CORS policy (`cors()` with no options) allows all origins —
  restrict it to your real frontend domain in production.

## Roadmap for the remaining phases

### Phase 8 (remainder) — Daily Quest
- New table `daily_quest_templates` (learn/think/do activity definitions
  per age group) + `child_daily_quest` tracking today's 3 tasks and
  completion state.
- Reuse the existing `question_log` + `daily_activity` tables you already
  have — the "Learn: 5 questions" and "Think: 1 puzzle" pieces slot
  directly into the question engine that's already built.
- Mystery Box: a `POST /api/quest/claim` endpoint that rolls a random
  reward from a weighted table (small coin range + occasional reward-shop
  item) once all 3 daily tasks are done.

### Phase 9 — AI Adaptive Learning
- Track a rolling accuracy-per-topic score per child (the `question_log`
  table already has everything needed — this is a query, not new storage).
- Before serving a question set, weight selection toward topics below a
  target accuracy threshold instead of pure random `shuffle()` in
  `routes/questions.js`.
- Optional: call an LLM (e.g. the Claude API) to generate fresh questions
  on weak topics on the fly, validated against a rubric before being shown
  to the child — keeps the question bank growing without manual authoring.

### Phase 10 — Multiplayer / School System
- New `schools` and `classrooms` tables; a `teacher` role alongside
  `parent`/`child` in the JWT `role` claim.
- Leaderboards: an indexed query on `children.xp` scoped to a classroom.
- Real-time features (live quiz races, co-op puzzle levels) would need a
  WebSocket layer (Socket.IO pairs well with the existing Express server)
  rather than the current stateless REST API.

### Other worlds (Maths Kingdom, Space World, Puzzle Island)
The `worlds` table and `dashboard.html` already render any world marked
`is_active = 1` as clickable — right now only `jungle` is. To add a second
world: seed its `game_levels` rows the same way `seed.js` does for Jungle,
flip its `is_active` flag, and build a `world-<id>.html` page (you can
literally copy `world-jungle.html` — it's driven entirely by the API
response, no jungle-specific logic is hardcoded in it beyond the file name).
