# LearnQuest — 3D Jungle Runner + Learning Platform

LearnQuest is a parent + child gamified learning web app. This build is ready for a GitHub → Railway deployment and uses Railway MySQL when `MYSQL_URL` is configured.

## What is included

- Parent signup/login and child profiles with PIN login
- English / Hindi / Marathi interface data
- 72 bundled age-group learning questions (Maths / English / GK)
- MySQL production database with automatic schema creation and seed data
- SQLite fallback for local development
- XP, coins, overall level and streaks
- Parent-assigned tasks and progress dashboard
- Reward shop with unlock + equip support
- 4 worlds in the data model; Jungle World is the active playable world
- 10 Jungle levels with progressive unlocks and a boss level
- **Three.js 3D Jungle Runner** with original procedural graphics (Three.js 0.185.1 is pinned server-side and served locally, with matching CDN fallbacks)
  - auto-running 3-lane runway
  - left/right lane switching
  - jump and slide
  - keyboard + touch/swipe controls
  - logs, hanging branches, boulders, pits, moving hazards and two-lane traps
  - one-hit crash gameplay; equipped shield can save one crash
  - coins, golden keys, shield, magnet and focus-boost pickups
  - rising speed and focus-combo score
  - age-group speed tuning
  - integrated learning gates placed directly in the 3D runway
  - wrong learning lane ends a normal run unless shielded
  - boss level uses Guardian HP + child lives
  - level missions, 3-star scoring and best-run statistics
  - level unlock, XP and coin rewards saved to MySQL
  - equipped cape, parrot, sword and power rewards affect the runner

The runner uses original low-poly/procedural geometry and Temple-Run-style **mechanics only**; it does not copy Temple Run art, characters, maps, branding or assets.

## Railway deployment

Repository layout must be:

```text
repo/
└── learnquest/
    ├── package.json
    ├── backend/
    └── frontend/
```

Set Railway service **Root Directory** to:

```text
/learnquest
```

Add these variables to the LearnQuest application service:

```text
JWT_SECRET=<long-random-secret>
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

Then deploy. Database tables and bundled content are created/updated automatically at server startup.

Health check:

```text
/api/health
```

Expected production response:

```json
{"ok":true,"service":"learnquest-api","database":"mysql"}
```

## Runner controls

Desktop:

- Left: `←` or `A`
- Right: `→` or `D`
- Jump: `↑`, `W` or `Space`
- Slide: `↓` or `S`
- Pause: `P` or `Esc`

Touch:

- Swipe left/right to change lane
- Swipe up to jump
- Swipe down to slide
- On-screen controls are also available

## Learning gate rules

Normal levels use 3 learning gates and require at least 2 correct server-side. Because a wrong answer lane is a crash in the runner, a no-shield perfect run normally answers all gates correctly. A Guardian Shield can absorb one wrong choice.

The boss level provides 8 gates and requires 5 correct answers. Boss mistakes remove player lives instead of always ending the run immediately.

## Database tables

Core tables:

- `parents`
- `children`
- `subjects`
- `questions`
- `worlds`
- `game_levels`
- `child_level_progress`
- `question_log`
- `rewards`
- `child_rewards`
- `parent_tasks`
- `daily_activity`

3D runner additions:

- `game_runs`
- `game_run_answers`
- `level_run_stats`
- `child_equipped_rewards`

## Important

Do not commit a real `.env` file or Railway secrets to GitHub. `.env.example` is safe as a template.
