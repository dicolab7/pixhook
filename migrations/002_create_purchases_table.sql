CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,

  android_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  purchase_token TEXT NOT NULL UNIQUE,

  purchase_time TIMESTAMP,
  acknowledged BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'ACTIVE',
  -- ACTIVE | CANCELED | REFUNDED | EXPIRED

  source TEXT DEFAULT 'PLAY_STORE',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_purchases_device
    FOREIGN KEY (android_id)
    REFERENCES devices(android_id)
    ON DELETE CASCADE
);
