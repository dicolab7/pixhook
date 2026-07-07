// routes/adminDevice.js (exemplo)
import express from 'express';
import { db } from '../db.js';
import { requireAdminOrKey } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/device/plan', requireAdminOrKey, async (req, res) => {
  const { android_id, plan } = req.body;
  if (!android_id || !['FREE', 'PRO'].includes(plan)) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  // garante device existe
  await db.query(
    `INSERT INTO devices (android_id, plan)
     VALUES ($1, $2)
     ON CONFLICT (android_id)
     DO UPDATE SET plan = EXCLUDED.plan`,
    [android_id, plan]
  ); // upsert é padrão pra lidar com duplicados [web:389]

  return res.json({ ok: true, android_id, plan });
});

export default router;
