import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import purchaseRoutes from './routes/purchase.js';
import rtdnRoutes from './routes/rtdn.js';
import deviceRoutes from './routes/device.js';
import adminDeviceRoutes from './routes/adminDevice.js';
import { loginAdmin, requireAdmin } from './middleware/adminAuth.js';

import migrate from './migrate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicSiteDir = path.resolve(__dirname, '../webhook_page');
const adminPublicDir = path.join(__dirname, 'public');

function configuredOrigins() {
  return [
    process.env.PUBLIC_URL,
    process.env.CORS_ORIGIN
  ].filter(Boolean);
}

async function bootstrap() {
  console.log('Rodando migrate...');
  await migrate();

  const app = express();
  app.set('trust proxy', 1);

  const allowedOrigins = configuredOrigins();
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    }
  }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(express.text({ type: '*/*', limit: '1mb' }));

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });

  app.use('/api', apiRoutes);
  app.use('/api/purchase', purchaseRoutes);
  app.use('/api/rtdn', rtdnRoutes);
  app.use('/api/device', deviceRoutes);

  app.get('/admin/login', (_, res) => {
    res.sendFile(path.join(adminPublicDir, 'admin-login.html'));
  });
  app.post('/admin/login', loginAdmin);
  app.use('/admin', adminDeviceRoutes);
  app.use('/admin', requireAdmin, adminRoutes);
  app.get('/admin', requireAdmin, (_, res) => {
    res.sendFile(path.join(adminPublicDir, 'index.html'));
  });
  app.get('/admin/plan', requireAdmin, (_, res) => {
    res.sendFile(path.join(adminPublicDir, 'admin-plan.html'));
  });
  app.get('/admin/app.js', requireAdmin, (_, res) => {
    res.sendFile(path.join(adminPublicDir, 'app.js'));
  });

  app.use(express.static(publicSiteDir));

  const port = process.env.PORT || 10000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`PixHook backend rodando na porta ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Erro no bootstrap:', err);
  process.exit(1);
});
