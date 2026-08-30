# Railway — exact final setup

1. Upload/push this `learnquest` folder to GitHub.
2. Railway `learnquest` service → Settings → Root Directory → `/learnquest`.
3. Railway `learnquest` service → Variables → add:
   - `MYSQL_URL=${{MySQL.MYSQL_URL}}`
   - `JWT_SECRET=<long-random-secret>`
4. Deploy the staged changes.
5. Open `/api/health` and confirm `"database":"mysql"`.
6. Open the Railway public domain. Create a parent account and child profile, then start Jungle World.

No manual table creation and no manual seed command are required. The server performs both automatically at startup.

If `MYSQL_URL` is not configured, the app intentionally falls back to SQLite so the site can still boot.
