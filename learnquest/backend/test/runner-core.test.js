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
