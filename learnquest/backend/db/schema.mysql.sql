CREATE TABLE IF NOT EXISTS parents (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS children (
  id VARCHAR(64) PRIMARY KEY,
  parent_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  age INT NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  class VARCHAR(80) NULL,
  language VARCHAR(8) NOT NULL DEFAULT 'en',
  avatar VARCHAR(32) NOT NULL DEFAULT '🦊',
  pin VARCHAR(16) NOT NULL,
  xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  overall_level INT NOT NULL DEFAULT 1,
  streak_count INT NOT NULL DEFAULT 0,
  last_active_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_children_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  INDEX idx_children_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  name_en VARCHAR(120) NOT NULL,
  name_hi VARCHAR(120) NOT NULL,
  name_mr VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  question_en TEXT NOT NULL,
  question_hi TEXT NOT NULL,
  question_mr TEXT NOT NULL,
  options_json LONGTEXT NOT NULL,
  correct_index INT NOT NULL,
  explanation_en TEXT NOT NULL,
  explanation_hi TEXT NOT NULL,
  explanation_mr TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 10,
  CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_questions_subject_age (subject_id, age_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS worlds (
  id VARCHAR(64) PRIMARY KEY,
  name_en VARCHAR(120) NOT NULL,
  name_hi VARCHAR(120) NOT NULL,
  name_mr VARCHAR(120) NOT NULL,
  emoji VARCHAR(32) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_levels (
  id VARCHAR(64) PRIMARY KEY,
  world_id VARCHAR(64) NOT NULL,
  level_number INT NOT NULL,
  name_en VARCHAR(160) NOT NULL,
  name_hi VARCHAR(160) NOT NULL,
  name_mr VARCHAR(160) NOT NULL,
  unlock_type VARCHAR(30) NOT NULL,
  unlock_value INT NULL,
  gate_subject_id VARCHAR(64) NULL,
  questions_required INT NOT NULL DEFAULT 3,
  is_boss TINYINT(1) NOT NULL DEFAULT 0,
  boss_hp INT NULL DEFAULT 5,
  CONSTRAINT fk_levels_world FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  CONSTRAINT fk_levels_subject FOREIGN KEY (gate_subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  UNIQUE KEY uq_world_level (world_id, level_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_level_progress (
  id VARCHAR(64) PRIMARY KEY,
  child_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'locked',
  attempts INT NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  CONSTRAINT fk_progress_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_level FOREIGN KEY (level_id) REFERENCES game_levels(id) ON DELETE CASCADE,
  UNIQUE KEY uq_child_level (child_id, level_id),
  INDEX idx_progress_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_log (
  id VARCHAR(64) PRIMARY KEY,
  child_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NULL,
  correct TINYINT(1) NOT NULL,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qlog_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_qlog_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_qlog_level FOREIGN KEY (level_id) REFERENCES game_levels(id) ON DELETE SET NULL,
  INDEX idx_question_log_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR(64) PRIMARY KEY,
  name_en VARCHAR(160) NOT NULL,
  name_hi VARCHAR(160) NOT NULL,
  name_mr VARCHAR(160) NOT NULL,
  type VARCHAR(40) NOT NULL,
  cost_coins INT NOT NULL,
  emoji VARCHAR(32) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS child_rewards (
  id VARCHAR(64) PRIMARY KEY,
  child_id VARCHAR(64) NOT NULL,
  reward_id VARCHAR(64) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_child_rewards_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_child_rewards_reward FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
  UNIQUE KEY uq_child_reward (child_id, reward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parent_tasks (
  id VARCHAR(64) PRIMARY KEY,
  parent_id VARCHAR(64) NOT NULL,
  child_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  reward_type VARCHAR(30) NOT NULL DEFAULT 'coins',
  reward_value INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  INDEX idx_tasks_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_activity (
  id VARCHAR(64) PRIMARY KEY,
  child_id VARCHAR(64) NOT NULL,
  activity_date DATE NOT NULL,
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  minutes_learning INT NOT NULL DEFAULT 0,
  minutes_game INT NOT NULL DEFAULT 0,
  daily_quest_done TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_daily_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE KEY uq_child_activity_date (child_id, activity_date),
  INDEX idx_daily_activity_child_date (child_id, activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
