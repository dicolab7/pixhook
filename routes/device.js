// routes/device.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();
const FREE_LIMIT = 5;

router.post('/init', async (req, res) => {
  const { android_id } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  console.log('🆔 init device:', android_id);

  if (!android_id) {
    console.log('❌ android_id ausente');
    return res.status(400).json({ error: 'android_id obrigatório' });
  }

  let device = await db.query(
    'SELECT * FROM devices WHERE android_id = $1',
    [android_id]
  );

  if (device.rowCount === 0) {
    console.log('➕ criando device FREE');

    await db.query(
      `INSERT INTO devices (android_id, plan, daily_count, last_date)
       VALUES ($1, 'FREE', 0, $2)`,
      [android_id, today]
    );

    return res.json({
      plan: 'FREE',
      remaining: FREE_LIMIT
    });
  }

  device = device.rows[0];

  console.log('📄 device encontrado:', device.plan);

  if (device.plan === 'PRO') {
    return res.json({
      plan: 'PRO',
      unlimited: true
    });
  }

  if (device.last_date !== today) {
    console.log('🔄 novo dia, reset contador');

    await db.query(
      'UPDATE devices SET daily_count = 0, last_date = $1 WHERE android_id = $2',
      [today, android_id]
    );

    return res.json({
      plan: 'FREE',
      remaining: FREE_LIMIT
    });
  }

  console.log('📊 remaining:', FREE_LIMIT - device.daily_count);

  return res.json({
    plan: 'FREE',
    remaining: FREE_LIMIT - device.daily_count
  });
});

export default router;
