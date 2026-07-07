import express from 'express';
import { db } from '../db.js';
import { loginAdmin, logoutAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);

router.get('/devices', async (_, res) => {
  const { rows } = await db.query('SELECT * FROM devices ORDER BY created_at DESC');
  res.json(rows);
});

router.put('/plan', async (req, res) => {
  const { android_id, plan } = req.body;

  if (!android_id || !['FREE', 'PRO'].includes(plan)) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  await db.query(
    'UPDATE devices SET plan = $1 WHERE android_id = $2',
    [plan, android_id]
  );

  res.json({ ok: true });
});

router.delete('/device/:id', async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'invalid device id' });
  }

  await db.query(
    'DELETE FROM devices WHERE android_id = $1',
    [req.params.id]
  );

  res.json({ ok: true });
});

export default router;
