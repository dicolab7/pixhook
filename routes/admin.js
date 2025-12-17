import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/devices', async (_, res) => {
  const { rows } = await db.query('SELECT * FROM devices ORDER BY created_at DESC');
  res.json(rows);
});

router.put('/plan', async (req, res) => {
  const { android_id, plan } = req.body;

  await db.query(
    'UPDATE devices SET plan = $1 WHERE android_id = $2',
    [plan, android_id]
  );

  res.json({ ok: true });
});

router.delete('/device/:id', async (req, res) => {
  await db.query(
    'DELETE FROM devices WHERE android_id = $1',
    [req.params.id]
  );

  res.json({ ok: true });
});

export default router;
