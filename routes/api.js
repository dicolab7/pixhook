// routes/api.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();
const FREE_LIMIT = 5;

router.post('/check', async (req, res) => {
  const { android_id } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  let device = await db.query(
    'SELECT * FROM devices WHERE android_id = $1',
    [android_id]
  );

  if (device.rowCount === 0) {
    await db.query(
      'INSERT INTO devices (android_id, plan, daily_count, last_date) VALUES ($1, $2, 1, $3)',
      [android_id, 'FREE', today]
    );
    return res.json({ allowed: true, remaining: FREE_LIMIT - 1 });
  }

  device = device.rows[0];

  if (device.plan === 'PRO') {
    return res.json({ allowed: true, unlimited: true });
  }

  if (device.last_date !== today) {
    await db.query(
      'UPDATE devices SET daily_count = 1, last_date = $1 WHERE android_id = $2',
      [today, android_id]
    );
    return res.json({ allowed: true, remaining: FREE_LIMIT - 1 });
  }

  if (device.daily_count >= FREE_LIMIT) {
    return res.json({ allowed: false });
  }

  await db.query(
    'UPDATE devices SET daily_count = daily_count + 1 WHERE android_id = $1',
    [android_id]
  );

  res.json({
    allowed: true,
    remaining: FREE_LIMIT - (device.daily_count + 1)
  });
});

export default router;
