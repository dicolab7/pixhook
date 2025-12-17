// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import purchaseRoutes from './routes/purchase.js';
import rtdnRoutes from './routes/rtdn.js';
import deviceRoutes from './routes/device.js';
import adminDeviceRoutes from './routes/adminDevice.js';

import migrate from './migrate.js';

dotenv.config();

async function bootstrap() {
  console.log('🧱 Rodando migrate...');
  await migrate();

  const app = express();
  app.use(cors());

  app.use(express.json());
  app.use(express.text({ type: '*/*' }));

  app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.originalUrl}`);
    console.log('📦 body:', req.body);
    next();
  });

  app.use(express.static('public'));

  app.use('/api', apiRoutes);
  app.use('/admin', adminRoutes);
  app.use('/api/purchase', purchaseRoutes);
  app.use('/api/rtdn', rtdnRoutes);
  app.use('/api/device', deviceRoutes);
  app.use('/admin', adminDeviceRoutes);

  const port = process.env.PORT || 10000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`🔥 PixHook backend rodando na porta ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Erro no bootstrap:', err);
  process.exit(1);
});


// // server.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';

// import apiRoutes from './routes/api.js';
// import adminRoutes from './routes/admin.js';
// import purchaseRoutes from './routes/purchase.js';
// import rtdnRoutes from './routes/rtdn.js';
// import deviceRoutes from './routes/device.js';

// dotenv.config();

// const app = express();
// app.use(cors());

// // 👇 ESSENCIAL
// app.use(express.json());
// app.use(express.text({ type: "*/*" }));

// // 🔍 DEBUG GLOBAL
// app.use((req, res, next) => {
//   console.log(`➡️ ${req.method} ${req.originalUrl}`);
//   console.log('📦 body:', req.body);
//   next();
// });

// app.use(express.static('public'));

// app.use('/api', apiRoutes);
// app.use('/admin', adminRoutes);
// app.use('/api/purchase', purchaseRoutes);
// app.use('/api/rtdn', rtdnRoutes);
// app.use('/api/device', deviceRoutes);

// app.listen(process.env.PORT, '0.0.0.0', () => {
//   console.log(`🔥 PixHook backend rodando na porta ${process.env.PORT}`);
// });
