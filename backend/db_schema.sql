-- schema.sql
-- Unified Sprint Tracking Application (SQLite Version)

CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    area_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Lead', 'Developer')),
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_stories (
    story_id INTEGER PRIMARY KEY, -- Work Item ID
    sprint_id TEXT NOT NULL,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    work_item_type TEXT NOT NULL CHECK (work_item_type IN ('User Story', 'Issue', 'Feature')),
    title TEXT NOT NULL,
    assigned_to TEXT,
    state TEXT,
    tags TEXT,
    test_plan_url TEXT,
    test_run_url TEXT,
    status_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data for Teams
INSERT INTO teams (name, area_path) VALUES
    ('Philomath', 'UCMGen3\Team 1 - Philomath'),
    ('Zesture', 'UCMGen3\Team 2 - Zesture'),
    ('Titans', 'UCMGen3\Team 3 - Titans'),
    ('Alpha', 'UCMGen3\Team 4 - Alpha'),
    ('Artisans', 'UCMGen3\Team 5 - Artisans')
ON CONFLICT (name) DO NOTHING;
