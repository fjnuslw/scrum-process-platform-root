CREATE TABLE IF NOT EXISTS sprints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS user_stories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  story_points DECIMAL(4, 1) NOT NULL,
  priority_order INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'todo',
  sprint_id BIGINT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_story_sprint
    FOREIGN KEY (sprint_id) REFERENCES sprints(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS retrospectives (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sprint_id BIGINT NOT NULL UNIQUE,
  good_1 VARCHAR(500) NOT NULL,
  good_2 VARCHAR(500) NOT NULL,
  good_3 VARCHAR(500) NOT NULL,
  improve_1 VARCHAR(500) NOT NULL,
  improve_2 VARCHAR(500) NOT NULL,
  improve_3 VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_retrospective_sprint
    FOREIGN KEY (sprint_id) REFERENCES sprints(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS burndown_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sprint_id BIGINT NOT NULL,
  log_date DATE NOT NULL,
  remaining_points DECIMAL(6, 1) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_burndown_day (sprint_id, log_date),
  CONSTRAINT fk_burndown_sprint
    FOREIGN KEY (sprint_id) REFERENCES sprints(id)
    ON DELETE CASCADE
);
