require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb } = require('./db');
const ordersRouter = require('./orders');
const { servicesRouter, equipmentRouter } = require('./services_equipment');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(cors({
  origin(origin, callback) {
    if (!origin || !FRONTEND_URL || origin === FRONTEND_URL) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS blocked'));
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/img', express.static(path.join(__dirname, 'img')));

app.use('/api/orders', ordersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/equipment', equipmentRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Pixel Media CRM server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
