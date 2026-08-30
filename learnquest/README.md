# LearnQuest — Final Deployable Build

LearnQuest is a parent + child gamified learning web app. This build serves the frontend and API from one Express service and automatically prepares the game database on startup.

## What works

- Parent sign up / login
- Child profile creation and 4-digit PIN login
- English / Hindi / Marathi UI
- Child dashboard with XP, coins, level and streak
- Jungle World with 10 sequential levels
- Phaser-based side-scrolling game
- Collectible coins
- Knowledge Gates with age-group questions
- Boss battle
- Automatic next-level unlock
- Reward Shop
- Parent-assigned tasks and child task completion
- Parent progress dashboard, subject accuracy and weak topics
- MySQL production database support
- SQLite automatic fallback for zero-config development/demo
- Automatic schema creation and automatic seed data

## Database

On startup the server automatically creates all required tables and seeds game content. No manual SQL import is required.

Tables:

1. `parents`
2. `children`
3. `subjects`
4. `questions`
5. `worlds`
6. `game_levels`
7. `child_level_progress`
8. `question_log`
9. `rewards`
10. `child_rewards`
11. `parent_tasks`
12. `daily_activity`

### Database selection

The app uses MySQL when either `MYSQL_URL` or the Railway MySQL variables are present. If no MySQL configuration is available, it automatically uses SQLite.

MySQL variables supported:

- `MYSQL_URL`
- or `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

SQLite optional variable:

- `SQLITE_PATH=/data/learnquest.sqlite`

## Railway deployment

This ZIP is designed for the repository structure:

```text
repo-root/
└── learnquest/
    ├── package.json
    ├── backend/
    └── frontend/
```

For an existing Railway service, set **Root Directory** to:

```text
/learnquest
```

The root `package.json` installs the backend dependencies and starts the Express server automatically.

### Connect the existing Railway MySQL service

In the **learnquest service → Variables**, add:

```text
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

If your database service has a different service name, replace `MySQL` with that Railway service name.

Also add a strong secret:

```text
JWT_SECRET=replace-with-a-long-random-secret
```

Deploy the staged changes. The next startup will connect to MySQL, create all tables, seed subjects/questions/worlds/levels/rewards, and then start the site.

If you do not add `MYSQL_URL`, the site still runs using SQLite fallback. For production persistence, MySQL is recommended.

## Health check

Open:

```text
/api/health
```

Expected MySQL response:

```json
{
  "ok": true,
  "service": "learnquest-api",
  "database": "mysql"
}
```

If SQLite fallback is active, `database` will be `sqlite`.

## Game flow

```text
Parent account
→ Create child profile
→ Child logs in with Child ID + PIN
→ Dashboard
→ Jungle World
→ Level 1
→ Move with arrow keys / on-screen buttons
→ Collect coins
→ Reach Knowledge Gate
→ Answer questions
→ Pass gate
→ Earn XP + coins
→ Unlock next level
→ Level 10 Boss Battle
```

Normal gates require roughly 2 out of 3 correct answers. The boss requires 5 correct answers. The bundled question bank contains enough unique Maths questions for the boss across all supported age groups.

## Local run

Requires Node.js 20.

```bash
npm install
npm start
```

Then open `http://localhost:4000`.

Without MySQL variables the local app uses SQLite automatically.
