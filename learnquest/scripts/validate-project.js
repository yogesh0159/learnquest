const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const ok = [];
function assert(condition, message) { if (!condition) throw new Error(message); ok.push(message); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function checkSyntax(rel, moduleMode = false) {
  const source = read(rel);
  const tmp = path.join(os.tmpdir(), `lq-${path.basename(rel).replace(/[^a-z0-9]/gi,'_')}-${Date.now()}${moduleMode ? '.mjs' : '.js'}`);
  fs.writeFileSync(tmp, source);
  const result = cp.spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  assert(result.status === 0, `JavaScript syntax: ${rel}${result.stderr ? `\n${result.stderr}` : ''}`);
}

try {
  // Packages / pinned engine
  const rootPkg = JSON.parse(read('package.json'));
  const backendPkg = JSON.parse(read('backend/package.json'));
  assert(rootPkg.engines?.node === '20.x', 'Root package pins Node 20.x');
  assert(backendPkg.engines?.node === '20.x', 'Backend package pins Node 20.x');
  assert(backendPkg.dependencies?.three === '0.185.1', 'Three.js is pinned to 0.185.1');
  assert(Boolean(backendPkg.dependencies?.mysql2), 'MySQL driver is present');

  // Backend and browser JS syntax.
  const backendFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) backendFiles.push(path.relative(root, full));
    }
  }
  walk(path.join(root, 'backend'));
  backendFiles.forEach((f) => checkSyntax(f));
  for (const f of fs.readdirSync(path.join(root, 'frontend/js')).filter((n) => n.endsWith('.js'))) checkSyntax(`frontend/js/${f}`, true);

  // Inline scripts and local asset links.
  const htmlFiles = fs.readdirSync(path.join(root, 'frontend')).filter((n) => n.endsWith('.html'));
  for (const name of htmlFiles) {
    const rel = `frontend/${name}`;
    const html = read(rel);
    const inlineRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let m; let index = 0;
    while ((m = inlineRe.exec(html))) {
      if (!m[1].trim()) continue;
      const tmp = path.join(os.tmpdir(), `lq-inline-${name}-${index++}.mjs`);
      fs.writeFileSync(tmp, m[1]);
      const result = cp.spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
      fs.unlinkSync(tmp);
      assert(result.status === 0, `Inline JavaScript syntax: ${rel}`);
    }

    const refRe = /\b(?:src|href)=["']([^"']+)["']/gi;
    while ((m = refRe.exec(html))) {
      const ref = m[1];
      if (/^(?:https?:|mailto:|tel:|#|data:)/i.test(ref)) continue;
      const clean = ref.split(/[?#]/)[0];
      if (!clean) continue;
      const target = clean.startsWith('/') ? path.join(root, 'frontend', clean.replace(/^\//,'')) : path.resolve(path.dirname(path.join(root, rel)), clean);
      assert(fs.existsSync(target), `Local asset exists: ${rel} -> ${ref}`);
    }
  }

  // Seed content semantic checks without loading app dependencies.
  const seed = read('backend/db/seed.js');
  const start = seed.indexOf('const subjects');
  const end = seed.indexOf('async function upsertById');
  assert(start >= 0 && end > start, 'Seed content section is readable');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(seed.slice(start, end) + ';globalThis.__seed={subjects,questions,worlds,jungleLevels,rewards};', ctx);
  const data = ctx.__seed;
  assert(data.subjects.length === 3, 'Seed has 3 learning subjects');
  assert(data.questions.length >= 72, 'Seed has at least 72 learning questions');
  assert(data.worlds.length === 4, 'Seed has 4 worlds');
  assert(data.jungleLevels.length === 10, 'Seed has 10 Jungle levels');
  assert(data.jungleLevels[data.jungleLevels.length - 1].is_boss === 1, 'Level 10 is the Jungle Guardian boss');
  assert(data.rewards.length >= 9, 'Seed has at least 9 rewards');
  const counts = {};
  for (const q of data.questions) {
    assert(Array.isArray(q.options) && q.options.length >= 3, `Question has options: ${q.question_en}`);
    assert(Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < q.options.length, `Question correct index valid: ${q.question_en}`);
    const key = `${q.subject_id}|${q.age_group}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  for (const subject of ['maths','english','gk']) for (const age of ['4-6','7-9','10-12']) {
    assert((counts[`${subject}|${age}`] || 0) >= 8, `At least 8 ${subject} questions for age ${age}`);
  }

  // Database schema coverage.
  for (const file of ['backend/db/schema.sqlite.sql','backend/db/schema.mysql.sql']) {
    const sql = read(file);
    const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/gi)].map((x) => x[1]);
    assert(new Set(tables).size === 16, `${file} defines 16 tables`);
    for (const required of ['parents','children','questions','game_levels','child_level_progress','game_runs','game_run_answers','level_run_stats','child_equipped_rewards']) {
      assert(tables.includes(required), `${file} includes ${required}`);
    }
  }

  // Runner integration checks.
  const runner = read('frontend/js/jungle-runner.js');
  assert(runner.includes('/vendor/three/three.module.js'), 'Runner prefers locally served Three.js');
  assert(runner.includes('three@0.185.1'), 'Runner CDN fallback matches pinned Three.js');
  assert(runner.includes('moveLane(-1)') && runner.includes('moveLane(1)') && runner.includes('jump()') && runner.includes('slide()'), 'Runner includes lane, jump and slide controls');
  assert(runner.includes('runnerAnswer') && runner.includes('spawnAnswerGate'), 'Runner learning gates are integrated');
  assert(runner.includes('crash("wrong-answer")'), 'Wrong learning lane can end the run');
  assert(!runner.toLowerCase().includes('phaser'), 'Legacy Phaser engine is not used by the 3D runner');



  // Production hotfix regression checks.
  const dbIndex = read('backend/db/index.js');
  assert(dbIndex.includes('ALTER TABLE children MODIFY COLUMN pin VARCHAR(255) NOT NULL'), 'Existing MySQL children.pin is widened automatically');
  const authRoute = read('backend/routes/auth.js');
  assert(authRoute.includes('STALE_PARENT_SESSION'), 'Stale parent sessions are rejected before child insert');
  const apiClient = read('frontend/js/api.js');
  assert(apiClient.includes('res.status === 401 && auth') && apiClient.includes('clearSession()'), 'Authenticated 401 responses clear stale browser sessions');
  const serverSource = read('backend/server.js');
  assert(serverSource.includes('https://fonts.googleapis.com') && serverSource.includes('https://fonts.gstatic.com'), 'CSP allows configured Google Fonts');
  assert(serverSource.includes('https://cdn.jsdelivr.net') && serverSource.includes('https://unpkg.com'), 'CSP allows Three.js CDN fallbacks');
  const profileSetup = read('frontend/profile-setup.html');
  assert(profileSetup.includes('id="createProfileBtn"') && profileSetup.includes('submitBtn.disabled = true'), 'Child profile form prevents duplicate submissions');

  console.log(`✅ LearnQuest validation passed (${ok.length} checks).`);
} catch (error) {
  console.error('❌ LearnQuest validation failed:', error.message);
  process.exit(1);
}
