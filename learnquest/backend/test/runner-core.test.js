const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function importCore(name) {
  const file = path.resolve(__dirname, `../../frontend/js/game/core/${name}.js`);
  return import(pathToFileURL(file));
}

test('collision system preserves jump, slide, collectible, and gate rules', async () => {
  const { classifyRunnerCollision } = await importCore('collision-system');
  const bounds = { zMin: .4, zMax: 3.35, playerZ: 2.1, laneRadius: 1.25, magnetRadius: 4.2, gateRadius: .9, jumpHeight: 1.05 };
  const state = { playerX: 0, jumpY: 0, sliding: false, magnetActive: false, invulnerable: false };
  const entity = (category, kind, x = 0, z = 2.1) => ({ category, kind, group: { position: { x, z } } });

  assert.deepEqual(classifyRunnerCollision(entity('obstacle', 'jump'), state, bounds), { type: 'crash', kind: 'jump' });
  assert.equal(classifyRunnerCollision(entity('obstacle', 'jump'), { ...state, jumpY: 1.06 }, bounds).type, 'none');
  assert.equal(classifyRunnerCollision(entity('obstacle', 'slide'), { ...state, sliding: true }, bounds).type, 'none');
  assert.equal(classifyRunnerCollision(entity('collectible', 'coin', 3.15), { ...state, magnetActive: true }, bounds).type, 'collect');
  assert.equal(classifyRunnerCollision(entity('gate'), state, bounds).type, 'gate');
});

test('closest lane and equipped reward helpers preserve runner state', async () => {
  const { closestLaneIndex } = await importCore('collision-system');
  const { equippedRewardsBySlot, initialRewardState } = await importCore('reward-system');
  assert.equal(closestLaneIndex(2.8, [-3.15, 0, 3.15]), 2);
  const equipped = equippedRewardsBySlot([{ slot: 'power', reward_id: 'reward_coin_magnet' }]);
  assert.deepEqual(initialRewardState(equipped), { shieldCharges: 0, magnetTimer: 12, doubleScoreTimer: 0 });
});

test('game loop caps frame delta and cancels cleanly', async () => {
  const { GameLoop } = await importCore('game-loop');
  let scheduled;
  let cancelled;
  const updates = [];
  const loop = new GameLoop({
    clock: { getDelta: () => .2 },
    update: (delta) => updates.push(delta),
    render: () => {},
    requestFrame: (callback) => { scheduled = callback; return 7; },
    cancelFrame: (id) => { cancelled = id; },
  });
  loop.start();
  scheduled();
  assert.deepEqual(updates, [.035]);
  loop.stop();
  assert.equal(cancelled, 7);
});

test('game loop default frame APIs retain the browser global receiver', async () => {
  const { GameLoop } = await importCore('game-loop');
  const originalRequestFrame = globalThis.requestAnimationFrame;
  const originalCancelFrame = globalThis.cancelAnimationFrame;
  let scheduled;
  let cancelled;

  globalThis.requestAnimationFrame = function requestAnimationFrame(callback) {
    assert.equal(this, globalThis);
    scheduled = callback;
    return 11;
  };
  globalThis.cancelAnimationFrame = function cancelAnimationFrame(id) {
    assert.equal(this, globalThis);
    cancelled = id;
  };

  try {
    const loop = new GameLoop({
      clock: { getDelta: () => .01 },
      update: () => {},
      render: () => {},
    });
    loop.start();
    assert.equal(typeof scheduled, 'function');
    loop.stop();
    assert.equal(cancelled, 11);
  } finally {
    if (originalRequestFrame === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalRequestFrame;
    if (originalCancelFrame === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = originalCancelFrame;
  }
});

test('learning focus uses age-appropriate minimum think times', async () => {
  const { thinkTimeSeconds } = await importCore('learning-focus');
  assert.equal(thinkTimeSeconds('4-6'), 8);
  assert.equal(thinkTimeSeconds('7-9'), 6);
  assert.equal(thinkTimeSeconds('10-12'), 5);
});

test('learning focus freezes forward updates, permits lane choice, and resumes without submitting', async () => {
  const { LearningFocus } = await importCore('learning-focus');
  let distance = 10;
  let score = 20;
  let lane = 1;
  let answersSubmitted = 0;
  let resumed = 0;
  const focus = new LearningFocus({ ageGroup: '7-9', onReady: () => { resumed++; } });
  const update = (seconds) => {
    if (focus.active) { focus.tick(seconds); return; }
    distance += 12 * seconds;
    score += 9 * seconds;
  };

  focus.start();
  lane = 2; // Lane input remains independent of forward simulation.
  update(2);
  assert.deepEqual({ distance, score, lane }, { distance: 10, score: 20, lane: 2 });
  assert.equal(focus.ready(), true);
  assert.equal(answersSubmitted, 0);
  assert.equal(resumed, 1);
  update(1);
  assert.deepEqual({ distance, score }, { distance: 22, score: 29 });
});

test('learning focus countdown resumes automatically and is wired into both runners', async () => {
  const fs = require('node:fs');
  const { LearningFocus } = await importCore('learning-focus');
  const focus = new LearningFocus({ ageGroup: '10-12' });
  focus.start();
  focus.tick(5);
  assert.equal(focus.active, false);

  for (const runner of ['jungle-runner.js', 'kingdom-runner.js']) {
    const source = fs.readFileSync(path.resolve(__dirname, `../../frontend/js/${runner}`), 'utf8');
    assert.match(source, /new LearningFocus/);
    assert.match(source, /if \(this\.learningFocus\.active\)/);
    assert.match(source, /this\.learningFocus\.start\(\)/);
  }
});

test('asset loader tries locations in order and returns the first success', async () => {
  const { loadModuleWithFallback } = await importCore('asset-manager');
  const attempted = [];
  const loaded = await loadModuleWithFallback(['local', 'fallback'], async (url) => {
    attempted.push(url);
    if (url === 'local') throw new Error('missing');
    return { source: url };
  });
  assert.deepEqual(attempted, ['local', 'fallback']);
  assert.deepEqual(loaded, { source: 'fallback' });
});

test('runtime quality uses measured frame time and preserves a low-power tier', async () => {
  const { RuntimeQualityManager, runnerQualityProfile } = await importCore('performance-manager');
  const changes = [];
  const manager = new RuntimeQualityManager({ initialTier: 'high', sampleSize: 3, onChange: (profile) => changes.push(profile.tier) });
  [35, 38, 34].forEach((ms) => manager.recordFrame(ms));
  assert.equal(manager.tier, 'balanced');
  // Cooldown prevents oscillation; repeated slow sample windows eventually
  // choose the playable no-shadow fallback based on measurements.
  for (let window = 0; window < 3; window++) [40, 42, 38].forEach((ms) => manager.recordFrame(ms));
  assert.equal(manager.tier, 'low');
  assert.equal(runnerQualityProfile({ innerWidth: 400, devicePixelRatio: 3 }, { hardwareConcurrency: 2 }, manager.tier).shadows, false);
  assert.deepEqual(changes, ['balanced', 'low']);
});
