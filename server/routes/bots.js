const router = require('express').Router();
const auth = require('../middleware/auth');
const Bot = require('../models/Bot');
const botRunner = require('../services/botRunner');

// All routes require auth
router.use(auth);

router.get('/', async (req, res) => {
  const bots = await Bot.find({ userId: req.user.id });
  res.json(bots.map(botToPublic));
});

router.post('/', async (req, res) => {
  const { name, token, adminChatId, timezone, templateId, nodes, edges } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });

  const bot = new Bot({
    userId: req.user.id,
    name,
    adminChatId,
    timezone,
    templateId,
    nodes: nodes || [],
    edges: edges || [],
  });
  if (token) bot.setToken(token);
  await bot.save();
  res.status(201).json(botToPublic(bot));
});

router.get('/:id', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });
  res.json(botToPublic(bot));
});

router.put('/:id', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  const { name, token, adminChatId, timezone, nodes, edges, schedule } = req.body;
  if (name !== undefined) bot.name = name;
  if (adminChatId !== undefined) bot.adminChatId = adminChatId;
  if (timezone !== undefined) bot.timezone = timezone;
  if (nodes !== undefined) bot.nodes = nodes;
  if (edges !== undefined) bot.edges = edges;
  if (schedule !== undefined) bot.schedule = schedule;
  if (token) bot.setToken(token);

  await bot.save();
  res.json(botToPublic(bot));
});

router.delete('/:id', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  if (bot.status === 'active') {
    await botRunner.stopBot(bot._id.toString());
  }
  await bot.deleteOne();
  res.json({ message: 'Deleted' });
});

router.post('/:id/start', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  const token = bot.getToken();
  if (!token) return res.status(400).json({ message: 'Bot token not set' });

  try {
    await botRunner.startBot(bot);
    bot.status = 'active';
    await bot.save();
    res.json({ status: bot.status });
  } catch (err) {
    bot.status = 'error';
    await bot.save();
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/token', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  if (bot.status === 'active') {
    await botRunner.stopBot(bot._id.toString());
    bot.status = 'stopped';
  }
  bot.tokenEncrypted = undefined;
  await bot.save();
  res.json(botToPublic(bot));
});

router.post('/:id/stop', async (req, res) => {
  const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
  if (!bot) return res.status(404).json({ message: 'Not found' });

  await botRunner.stopBot(bot._id.toString());
  bot.status = 'stopped';
  await bot.save();
  res.json({ status: bot.status });
});

function botToPublic(bot) {
  const obj = bot.toObject();
  delete obj.tokenEncrypted;
  obj.hasToken = !!bot.tokenEncrypted;
  return obj;
}

module.exports = router;
