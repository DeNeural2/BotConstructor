const router = require('express').Router();
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const Bot = require('../models/Bot');
const LeadSubmission = require('../models/LeadSubmission');

// Any origin - website forms submit from client domains
const open = cors({ origin: '*', methods: ['POST', 'OPTIONS'] });
router.use(open);

// Friendly labels for common form field names
const FIELD_LABELS = {
  name: '👤 Имя',           fullname: '👤 Имя',
  first_name: '👤 Имя',     last_name: '👤 Фамилия',
  email: '📧 Email',         mail: '📧 Email',
  phone: '📞 Телефон',       tel: '📞 Телефон',
  message: '💬 Сообщение',   comment: '💬 Комментарий',
  subject: '📌 Тема',        topic: '📌 Тема',
  city: '🏙️ Город',         company: '🏢 Компания',
  url: '🔗 Сайт',            website: '🔗 Сайт',
};

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatFields(data) {
  const lines = [];
  for (const [rawKey, val] of Object.entries(data)) {
    if (rawKey.startsWith('_') || rawKey === 'submit') continue;
    const label = FIELD_LABELS[rawKey.toLowerCase()] || `<b>${escHtml(rawKey)}</b>`;
    lines.push(`${label}: ${escHtml(String(val))}`);
  }
  return lines.join('\n') || '(нет данных)';
}

// POST /api/webhook/:botId  - called by the client's website form
router.post('/:botId', async (req, res) => {
  let bot;
  try {
    bot = await Bot.findById(req.params.botId).catch(() => null);
  } catch (_) { /* invalid ObjectId */ }

  if (!bot) return res.status(404).json({ error: 'Webhook not found' });

  const data = req.body || {};

  // Save submission first so it's never lost even if Telegram fails
  let lead;
  try {
    lead = await LeadSubmission.create({ botId: bot._id, data });
  } catch (err) {
    console.error('[webhook] save error:', err.message);
    return res.status(500).json({ error: 'Save failed' });
  }

  // Respond immediately so the web form doesn't hang
  res.json({ success: true, id: lead._id });

  // Send Telegram notification in the background
  const token = bot.getToken();
  if (!token || !bot.adminChatId) return;

  const fields = formatFields(data);
  const now = new Date().toLocaleString('ru-RU', {
    timeZone: bot.timezone || 'UTC',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const text = `📬 <b>Новая заявка с сайта</b>\n\n${fields}\n\n⏱ ${now}`;

  setImmediate(async () => {
    try {
      const tgBot = new TelegramBot(token);
      await tgBot.sendMessage(bot.adminChatId, text, { parse_mode: 'HTML' });
      await LeadSubmission.findByIdAndUpdate(lead._id, { notified: true });
    } catch (err) {
      console.error('[webhook notify]', err.message);
    }
  });
});

module.exports = router;
