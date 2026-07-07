import express from 'express';
import { db } from '../db.js';
import { verifyPlayPurchase } from '../services/googlePlay.js';

const router = express.Router();

router.post('/verify', async (req, res) => {
  const { android_id, product_id, purchase_token, package_name } = req.body;

  if (!android_id || !product_id || !purchase_token || !package_name) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const data = await verifyPlayPurchase(
      package_name,
      product_id,
      purchase_token
    );

    if (data.purchaseState !== 0) {
      return res.status(403).json({ error: 'Compra inválida' });
    }

    await db.query(
      `INSERT INTO purchases
        (android_id, product_id, purchase_token, purchase_time, acknowledged)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000), $5)
       ON CONFLICT (purchase_token) DO NOTHING`,
      [
        android_id,
        product_id,
        purchase_token,
        data.purchaseTimeMillis,
        data.acknowledgementState === 1
      ]
    );

    await db.query(
      `INSERT INTO purchase_events
        (purchase_token, event_type, payload)
       VALUES ($1, 'PURCHASED', $2)`,
      [purchase_token, data]
    );

    await db.query(
      `UPDATE devices SET plan = 'PRO' WHERE android_id = $1`,
      [android_id]
    );

    res.json({ ok: true, pro: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao verificar compra' });
  }
});

export default router;
