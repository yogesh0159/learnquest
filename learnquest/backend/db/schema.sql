-- LearnQuest database schema
-- NOTE: written for SQLite (zero-setup local dev / demo).
-- The data model maps 1:1 onto PostgreSQL if you move to production later
-- (swap AUTOINCREMENT -> SERIAL, TEXT dates -> TIMESTAMP, etc).

CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  age_group TEXT NOT NULL,       -- '4-6' | '7-9' | '10-12'
  class TEXT,                    -- e.g. 'Class 3'
  language TEXT NOT NULL DEFAULT 'en',  -- en | hi | mr
  avatar TEXT NOT NULL DEFAULT 'fox',
  pin TEXT NOT NULL,             -- 4-digit login PIN for the child
  xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  overall_level INTEGER NOT NULL DEFAULT 1,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  topic TEXT NOT NULL,
  age_group TEXT NOT NULL,       -- '4-6' | '7-9' | '10-12'
  difficulty TEXT NOT NULL,      -- easy | medium | hard
  question_en TEXT NOT NULL,
  question_hi TEXT NOT NULL,
  question_mr TEXT NOT NULL,
  options_json TEXT NOT NULL,    -- JSON array of {en,hi,mr}
  correct_index INTEGER NOT NULL,
  explanation_en TEXT NOT NULL,
  explanation_hi TEXT NOT NULL,
  explanation_mr TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  emoji TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_levels (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL REFERENCES worlds(id),
  level_number INTEGER NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  unlock_type TEXT NOT NULL,     -- 'free' | 'questions' | 'xp' | 'prior_level' | 'boss'
  unlock_value INTEGER,          -- e.g. 3 questions, or 200 xp
  gate_subject_id TEXT REFERENCES subjects(id),
  questions_required INTEGER NOT NULL DEFAULT 3,
  is_boss INTEGER NOT NULL DEFAULT 0,
  boss_hp INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS child_level_progress (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id),
  level_id TEXT NOT NULL REFERENCES game_levels(id),
  status TEXT NOT NULL DEFAULT 'locked', -- locked | unlocked | completed
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  UNIQUE(child_id, level_id)
);

CREATE TABLE IF NOT EXISTS question_log (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  level_id TEXT REFERENCES game_levels(id),
  correct INTEGER NOT NULL,
  answered_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  type TEXT NOT NULL,    -- character | clothes | pet | sword | power | vehicle | decoration
  cost_coins INTEGER NOT NULL,
  emoji TEXT
);

CREATE TABLE IF NOT EXISTS child_rewards (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id),
  reward_id TEXT NOT NULL REFERENCES rewards(id),
  unlocked_at TEXT DEFAULT (datetime('now')),
  UNIQUE(child_id, reward_id)
);

CREATE TABLE IF NOT EXISTS parent_tasks (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id),
  child_id TEXT NOT NULL REFERENCES children(id),
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL DEFAULT 'coins', -- coins | unlock_time
  reward_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',    -- pending | completed
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_activity (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id),
  activity_date TEXT NOT NULL,   -- YYYY-MM-DD
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  minutes_learning INTEGER NOT NULL DEFAULT 0,
  minutes_game INTEGER NOT NULL DEFAULT 0,
  daily_quest_done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(child_id, activity_date)
);
