CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,

  android_id TEXT NOT NULL,
  action TEXT NOT NULL,
  -- SEND_WEBHOOK | TEST_WEBHOOK | etc

  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_usage_device
    FOREIGN KEY (android_id)
    REFERENCES devices(android_id)
    ON DELETE CASCADE
);
