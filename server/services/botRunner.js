const TelegramBot = require('node-telegram-bot-api');
const { handleMessage, resetSession } = require('./flowInterpreter');
const { buildCalendar, buildHourPicker, buildMinutePicker } = require('./pickerBuilder');
const Bot = require('../models/Bot');
const BookedSlot = require('../models/BookedSlot');
const TelegramSession = require('../models/TelegramSession');

// Map botId -> TelegramBot instance
const instances = new Map();

async function startBot(botDoc) {
  const botId = botDoc._id.toString();

  if (instances.has(botId)) {
    await stopBot(botId);
  }

  const token = botDoc.getToken();
  if (!token) throw new Error('Token missing');

  const tgBot = new TelegramBot(token, { polling: true });

  // Helper: run interpreter and dispatch actions
  async function dispatch(chatId, userId, text) {
    const freshBot = await Bot.findById(botId);
    if (!freshBot || freshBot.status !== 'active') return;

    let actions;
    try {
      actions = await handleMessage(freshBot, userId, text);
    } catch (err) {
      console.error(`[Bot ${botId}] interpreter error:`, err.message);
      return;
    }

    for (const action of actions) {
      if (action.type === 'send') {
        const opts = {};
        if (action.inlineKeyboard) {
          // Rich picker keyboard (calendar / time)
          opts.reply_markup = { inline_keyboard: action.inlineKeyboard };
        } else if (action.keyboard && action.keyboard.length > 0) {
          // Regular inline buttons from a `buttons` node
          opts.reply_markup = {
            inline_keyboard: action.keyboard.map((label) => [{ text: label, callback_data: label }]),
          };
        }
        await tgBot.sendMessage(chatId, action.text, opts).catch(console.error);
      } else if (action.type === 'setMenu') {
        // Persistent reply keyboard — stays below the input field
        const opts = {
          reply_markup: {
            keyboard: action.keyboard.map((label) => [{ text: label }]),
            resize_keyboard: true,
            one_time_keyboard: false,
          },
        };
        await tgBot.sendMessage(chatId, '☰ Главное меню', opts).catch(console.error);
      } else if (action.type === 'notify') {
        await tgBot.sendMessage(action.chatId, action.text).catch(console.error);
      }
    }
  }

  tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || '';

    if (text === '/start') {
      await resetSession(botId, userId);
    }

    await dispatch(chatId, userId, text);
  });

  // Inline button presses come as callback_query, not as messages
  tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data  = query.data;
    const msgId = query.message.message_id;

    // ── Helpers for schedule-aware pickers ──────────────────────────────────
    async function getSchedAndSlots(userId, date) {
      const freshBot = await Bot.findById(botId).lean();
      const sched = freshBot?.schedule || {};
      let bookedSlots = [];
      if (sched.enabled && date) {
        bookedSlots = await BookedSlot.find({ botId, date }).lean();
      }
      return { sched, bookedSlots };
    }

    async function getPickerDate(userId) {
      const sess = await TelegramSession.findOne({ botId, telegramUserId: userId }).lean();
      return sess?.variables?.__picker_date || null;
    }

    // ── Calendar navigation ──────────────────────────────────────────────────
    if (data === 'cal:x' || data === 'time:x') {
      await tgBot.answerCallbackQuery(query.id).catch(() => {});
      return;
    }

    if (data.startsWith('cal:nav:')) {
      const parts = data.split(':');
      const year  = parseInt(parts[2]);
      const month = parseInt(parts[3]);
      const { sched } = await getSchedAndSlots(userId, null);
      const calOpts = sched.enabled ? { workDays: sched.workDays } : {};
      await tgBot.editMessageReplyMarkup(
        { inline_keyboard: buildCalendar(year, month, calOpts) },
        { chat_id: chatId, message_id: msgId }
      ).catch(() => {});
      await tgBot.answerCallbackQuery(query.id).catch(() => {});
      return;
    }

    if (data.startsWith('cal:pick:')) {
      const parts = data.split(':');
      const year  = parseInt(parts[2]);
      const month = parseInt(parts[3]);
      const day   = parseInt(parts[4]);
      const dt = new Date(year, month, day);
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dd}.${mm}.${dt.getFullYear()}`;

      // Collapse the calendar keyboard, show chosen date
      await tgBot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      await tgBot.answerCallbackQuery(query.id, { text: `📅 ${dateStr}` }).catch(() => {});
      await dispatch(chatId, userId, dateStr);
      return;
    }

    // ── Time picker ──────────────────────────────────────────────────────────
    if (data === 'time:back') {
      const pickerDate = await getPickerDate(userId);
      const { sched, bookedSlots } = await getSchedAndSlots(userId, pickerDate);
      const opts = sched.enabled
        ? { workStart: sched.workStart, workEnd: sched.workEnd, slotDuration: sched.slotDuration, bookedSlots }
        : {};
      await tgBot.editMessageReplyMarkup(
        { inline_keyboard: buildHourPicker(opts) },
        { chat_id: chatId, message_id: msgId }
      ).catch(() => {});
      await tgBot.answerCallbackQuery(query.id).catch(() => {});
      return;
    }

    if (data.startsWith('time:h:')) {
      const hour = parseInt(data.split(':')[2]);
      const pickerDate = await getPickerDate(userId);
      const { sched, bookedSlots } = await getSchedAndSlots(userId, pickerDate);
      const minuteOpts = sched.enabled
        ? { workEnd: sched.workEnd, slotDuration: sched.slotDuration, bookedSlots }
        : {};
      await tgBot.editMessageReplyMarkup(
        { inline_keyboard: buildMinutePicker(hour, minuteOpts) },
        { chat_id: chatId, message_id: msgId }
      ).catch(() => {});
      await tgBot.answerCallbackQuery(query.id).catch(() => {});
      return;
    }

    if (data.startsWith('time:pick:')) {
      const parts = data.split(':');
      const h = parseInt(parts[2]);
      const m = parseInt(parts[3]);
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      await tgBot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId }).catch(() => {});
      await tgBot.answerCallbackQuery(query.id, { text: `🕐 ${timeStr}` }).catch(() => {});
      await dispatch(chatId, userId, timeStr);
      return;
    }

    // ── Regular inline button (buttons node) ────────────────────────────────
    await tgBot.answerCallbackQuery(query.id).catch(() => {});
    await dispatch(chatId, userId, data);
  });

  tgBot.on('polling_error', async (err) => {
    console.error(`[Bot ${botId}] polling error:`, err.message);
    instances.delete(botId);
    await Bot.findByIdAndUpdate(botId, { status: 'error' });
  });

  instances.set(botId, tgBot);
}

async function stopBot(botId) {
  const tgBot = instances.get(botId);
  if (tgBot) {
    await tgBot.stopPolling().catch(() => {});
    instances.delete(botId);
  }
}

function isRunning(botId) {
  return instances.has(botId);
}

// On server startup, restart all previously active bots
async function restoreActiveBots() {
  try {
    const activeBots = await Bot.find({ status: 'active' });
    for (const bot of activeBots) {
      console.log(`[botRunner] Restoring bot: ${bot.name}`);
      await startBot(bot).catch(async (err) => {
        console.error(`[botRunner] Failed to restore bot ${bot._id}:`, err.message);
        await Bot.findByIdAndUpdate(bot._id, { status: 'error' });
      });
    }
  } catch (err) {
    console.error('[botRunner] restoreActiveBots error:', err.message);
  }
}

module.exports = { startBot, stopBot, isRunning, restoreActiveBots };
