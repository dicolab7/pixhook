import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

const androidpublisher = google.androidpublisher({
  version: 'v3',
  auth
});

export async function verifyPlayPurchase(packageName, productId, token) {
  const res = await androidpublisher.purchases.products.get({
    packageName,
    productId,
    token
  });

  return res.data;
}
