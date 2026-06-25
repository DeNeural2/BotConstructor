require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const botRunner = require('./services/botRunner');

const app = express();

// Webhook accepts POST from any domain (client websites submit forms here)
app.use('/api/webhook',
  require('cors')({ origin: '*', methods: ['POST', 'OPTIONS'] }),
  express.json(),
  express.urlencoded({ extended: true }),
  require('./routes/webhook')
);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/templates', require('./routes/templates'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/botconstructor';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await botRunner.restoreActiveBots();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
