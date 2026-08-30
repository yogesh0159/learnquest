# Railway setup — LearnQuest 3D Runner

1. Upload the contents of this `learnquest` folder to your GitHub repo's existing `/learnquest` directory.
2. In Railway, select the **learnquest application service**.
3. Settings → Root Directory: `/learnquest`
4. Variables → add:
   - `JWT_SECRET` = a long random secret
   - `MYSQL_URL` = `${{MySQL.MYSQL_URL}}`
5. Confirm the Railway MySQL service is Online.
6. Redeploy the application.
7. Open `/api/health` on the public LearnQuest domain. It should report `"database":"mysql"`.
8. Open the main domain, create/login a child, enter Jungle World and start Level 1.

No manual SQL import is required. Startup creates the runner tables and updates seed content automatically.

Three.js 0.185.1 is pinned with the backend and served locally from `/vendor/three/three.module.js`. The runner also has jsDelivr/unpkg fallbacks.
