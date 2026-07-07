import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const message = req.body?.message?.data;

  if (!message) return res.sendStatus(200);

  const decoded = JSON.parse(
    Buffer.from(message, 'base64').toString()
  );

  const {
    purchaseToken,
    notificationType
  } = decoded.subscriptionNotification || decoded.oneTimeProductNotification || {};

  if (!purchaseToken) return res.sendStatus(200);

  let status = 'ACTIVE';
  let event = 'UNKNOWN';

  switch (notificationType) {
    case 1:
      event = 'RECOVERED';
      status = 'ACTIVE';
      break;
    case 2:
      event = 'RENEWED';
      status = 'ACTIVE';
      break;
    case 3:
      event = 'CANCELED';
      status = 'CANCELED';
      break;
    case 4:
      event = 'PURCHASED';
      status = 'ACTIVE';
      break;
    case 12:
      event = 'REVOKED';
      status = 'REFUNDED';
      break;
  }

  await db.query(
    `INSERT INTO purchase_events
      (purchase_token, event_type, payload)
     VALUES ($1, $2, $3)`,
    [purchaseToken, event, decoded]
  );

  await db.query(
    `UPDATE purchases SET status = $1 WHERE purchase_token = $2`,
    [status, purchaseToken]
  );

  if (status !== 'ACTIVE') {
    await db.query(
      `UPDATE devices SET plan = 'FREE'
       WHERE android_id = (
         SELECT android_id FROM purchases WHERE purchase_token = $1
       )`,
      [purchaseToken]
    );
  }

  res.sendStatus(200);
});

export default router;
