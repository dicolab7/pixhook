CREATE TABLE IF NOT EXISTS purchase_events (
  id SERIAL PRIMARY KEY,

  purchase_token TEXT NOT NULL,
  event_type TEXT NOT NULL,
  -- PURCHASED | CANCELED | REFUNDED | RENEWED | TEST

  payload JSONB,

  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_event_purchase
    FOREIGN KEY (purchase_token)
    REFERENCES purchases(purchase_token)
    ON DELETE CASCADE
);
