CREATE TABLE IF NOT EXISTS devices (
  android_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'FREE',
  daily_count INT NOT NULL DEFAULT 0,
  last_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;

