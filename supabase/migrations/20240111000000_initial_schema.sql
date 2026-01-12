-- Initial schema for Navigium Editor
-- Create tables for app settings, user sessions, greetings, and known users

-- Enable RLS (Row Level Security) for all tables
-- Since this is a single-user app, we'll use simple policies

-- App settings table (for app password)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- We'll store hashed passwords
  lang TEXT DEFAULT 'LA',
  aktueller_karteikasten TEXT,
  gesamtpunkte_karteikasten INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username)
);

-- User greetings table
CREATE TABLE IF NOT EXISTS user_greetings (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  greeting TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username)
);

-- Known users table
CREATE TABLE IF NOT EXISTS known_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_users ENABLE ROW LEVEL SECURITY;

-- Simple policies: allow all operations (since it's a local app)
-- In production, you'd want proper authentication
CREATE POLICY "Allow all operations on app_settings" ON app_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_greetings" ON user_greetings FOR ALL USING (true);
CREATE POLICY "Allow all operations on known_users" ON known_users FOR ALL USING (true);

-- Insert default app password (hashed)
-- Note: In production, hash the password properly
INSERT INTO app_settings (key, value) VALUES ('app_password', 'cheater2025')
ON CONFLICT (key) DO NOTHING;