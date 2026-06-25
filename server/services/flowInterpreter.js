const TelegramSession = require('../models/TelegramSession');
const BookedSlot = require('../models/BookedSlot');
const { buildCalendar, buildHourPicker, t2m, m2t, slotFree } = require('./pickerBuilder');

// Replace {{variable}} placeholders with session variables
function interpolate(text, variables) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

function evalCondition(val, condition, expected) {
  const s = String(val ?? '');
  const e = String(expected ?? '');
  switch (condition) {
    case 'equals':       return s === e;
    case 'notEquals':    return s !== e;
    case 'contains':     return s.includes(e);
    case 'greaterThan':  return Number(val) > Number(expected);
    case 'lessThan':     return Number(val) < Number(expected);
    case 'greaterOrEqual': return Number(val) >= Number(expected);
    case 'lessOrEqual':  return Number(val) <= Number(expected);
    default:             return !!val;
  }
}

// ── Answer validation ────────────────────────────────────────────────────────

const MONTHS_RU = {
  'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
  'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
};

function parseDate(raw) {
  const s = raw.trim();
  const year0 = new Date().getFullYear();

  // "25 июня" or "25 июня 2024"
  const ru = s.match(/^(\d{1,2})\s+([а-яёА-ЯЁ]+)(?:\s+(\d{4}))?$/);
  if (ru) {
    const d = parseInt(ru[1]);
    const m = MONTHS_RU[ru[2].toLowerCase()];
    const y = ru[3] ? parseInt(ru[3]) : year0;
    if (m === undefined) return null;
    const dt = new Date(y, m, d);
    return dt.getDate() === d ? dt : null;
  }

  // "25.06", "25.06.2024", "25/06/2024", "25-06-2024"
  const num = s.match(/^(\d{1,2})[.\/\-](\d{1,2})(?:[.\/\-](\d{2}|\d{4}))?$/);
  if (num) {
    const d = parseInt(num[1]);
    const m = parseInt(num[2]) - 1;
    let y = num[3] ? parseInt(num[3]) : year0;
    if (y < 100) y += 2000;
    const dt = new Date(y, m, d);
    return dt.getDate() === d && dt.getMonth() === m ? dt : null;
  }

  return null;
}

function parseTime(raw) {
  const s = raw.trim();

  // "14:00", "14.00", "2:5" etc.
  const colon = s.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (colon) {
    const h = parseInt(colon[1]);
    const m = parseInt(colon[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { h, m };
    return null;
  }

  // Plain digits "1400", "930"
  const plain = s.match(/^(\d{3,4})$/);
  if (plain) {
    const n = parseInt(plain[1]);
    const h = Math.floor(n / 100);
    const m = n % 100;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { h, m };
    return null;
  }

  return null;
}

function validateAnswer(text, answerType) {
  if (!answerType || answerType === 'text') return { ok: true, value: text };

  if (answerType === 'date') {
    const dt = parseDate(text);
    if (!dt) return { ok: false, error: '❌ Не удалось распознать дату.\nПопробуйте: 25 июня, 25.06 или 25.06.2025' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dt < today) return { ok: false, error: '❌ Дата не может быть в прошлом. Укажите сегодняшнюю или будущую дату.' };
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return { ok: true, value: `${dd}.${mm}.${dt.getFullYear()}` };
  }

  if (answerType === 'time') {
    const t = parseTime(text);
    if (!t) return { ok: false, error: '❌ Не удалось распознать время. Попробуйте: 14:00' };
    const hh = String(t.h).padStart(2, '0');
    const mm = String(t.m).padStart(2, '0');
    return { ok: true, value: `${hh}:${mm}` };
  }

  return { ok: true, value: text };
}

// ── Build a lookup map: nodeId -> node
function buildNodeMap(nodes) {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

// Find next node id given current node and optional handle label (for buttons/conditions)
function nextNodeId(edges, sourceId, handle) {
  const edge = edges.find(
    (e) => e.source === sourceId && (handle === undefined || e.sourceHandle === handle || !e.sourceHandle)
  );
  return edge ? edge.target : null;
}

// Find start node
function findStart(nodes) {
  return nodes.find((n) => n.type === 'start');
}

async function getOrCreateSession(botId, telegramUserId) {
  let session = await TelegramSession.findOne({ botId, telegramUserId });
  if (!session) {
    session = new TelegramSession({ botId, telegramUserId, variables: {} });
  }
  return session;
}

// Handle an incoming message from a Telegram user.
// Returns an array of actions: { type: 'send', text, keyboard? } | { type: 'done' }
async function handleMessage(bot, telegramUserId, text) {
  const { _id: botId, nodes, edges } = bot;
  const nodeMap = buildNodeMap(nodes);
  const session = await getOrCreateSession(botId, telegramUserId);

  const actions = [];
  let nodeId = session.currentNodeId;

  // If no active node, begin from start
  if (!nodeId) {
    const start = findStart(nodes);
    if (!start) return [];
    nodeId = start.id;
  } else {
    // We have a pending node — the user just replied to it
    const pendingNode = nodeMap[nodeId];
    if (!pendingNode) {
      session.currentNodeId = null;
      await session.save();
      return [];
    }

    if (pendingNode.type === 'question') {
      const result = validateAnswer(text, pendingNode.data.answerType);
      if (!result.ok) {
        // Re-ask: send error then repeat the question, stay on this node
        actions.push({ type: 'send', text: result.error });
        actions.push({ type: 'send', text: interpolate(pendingNode.data.text, session.variables) });
        session.currentNodeId = pendingNode.id;
        session.updatedAt = new Date();
        await session.save();
        return actions;
      }
      const varName = pendingNode.data.variableName;
      if (varName) {
        session.variables[varName] = result.value;
        session.markModified('variables');
      }
      nodeId = nextNodeId(edges, pendingNode.id);
    } else if (pendingNode.type === 'buttons' || pendingNode.type === 'menu') {
      const saveAs = pendingNode.data.saveAs;
      if (saveAs) {
        session.variables[saveAs] = text;
        session.markModified('variables');
      }
      const matchingEdge = edges.find(
        (e) => e.source === pendingNode.id && e.sourceHandle === text
      );
      nodeId = matchingEdge ? matchingEdge.target : nextNodeId(edges, pendingNode.id);
    } else {
      nodeId = nextNodeId(edges, pendingNode.id);
    }
  }

  // Walk the graph until we hit a node that waits for user input
  while (nodeId) {
    const node = nodeMap[nodeId];
    if (!node) break;

    if (node.type === 'start') {
      nodeId = nextNodeId(edges, node.id);
      continue;
    }

    if (node.type === 'end') {
      session.currentNodeId = null;
      actions.push({ type: 'done' });
      break;
    }

    if (node.type === 'message') {
      const msg = interpolate(node.data.text, session.variables);
      actions.push({ type: 'send', text: msg });
      nodeId = nextNodeId(edges, node.id);
      continue;
    }

    if (node.type === 'buttons') {
      const msg = interpolate(node.data.text, session.variables);
      const buttons = (node.data.buttons || []).map((b) => b.label || b);
      // Inline buttons attached to the message (one-time keyboard)
      actions.push({ type: 'send', text: msg, keyboard: buttons, keyboardType: 'reply_once' });
      session.currentNodeId = node.id;
      break;
    }

    if (node.type === 'menu') {
      const buttons = (node.data.buttons || []).map((b) => b.label || b);
      // Persistent reply keyboard — stays until explicitly removed
      actions.push({ type: 'setMenu', keyboard: buttons });
      // Find the matching button edge and continue
      session.currentNodeId = node.id;
      break;
    }

    if (node.type === 'question') {
      const msg = interpolate(node.data.text, session.variables);
      const answerType = node.data.answerType || 'text';
      const sched = bot.schedule || {};

      if (answerType === 'date') {
        const now = new Date();
        const calOpts = sched.enabled ? { workDays: sched.workDays } : {};
        actions.push({ type: 'send', text: msg, inlineKeyboard: buildCalendar(now.getFullYear(), now.getMonth(), calOpts) });
      } else if (answerType === 'time') {
        // Fetch already-booked slots for the selected date (if dateVar is configured)
        let bookedSlots = [];
        if (sched.enabled && node.data.dateVar) {
          const dateVal = session.variables[node.data.dateVar];
          if (dateVal) {
            bookedSlots = await BookedSlot.find({ botId, date: dateVal }).lean();
          }
          // Store for time:back navigation in botRunner
          session.variables.__picker_date = session.variables[node.data.dateVar] || null;
          session.markModified('variables');
        }
        const pickerOpts = sched.enabled
          ? { workStart: sched.workStart, workEnd: sched.workEnd, slotDuration: sched.slotDuration, bookedSlots }
          : {};
        actions.push({ type: 'send', text: msg, inlineKeyboard: buildHourPicker(pickerOpts) });
      } else {
        actions.push({ type: 'send', text: msg });
      }
      session.currentNodeId = node.id;
      break;
    }

    if (node.type === 'booking') {
      const dateVal = session.variables[node.data.dateVar];
      const timeVal = session.variables[node.data.timeVar];

      if (!dateVal || !timeVal) {
        // Variables missing — skip silently
        nodeId = nextNodeId(edges, node.id);
        continue;
      }

      const sched = bot.schedule || {};
      const duration = sched.slotDuration || 60;
      const startMins = t2m(timeVal);
      const timeTo = m2t(startMins + duration);

      // Check conflict
      const daySlots = await BookedSlot.find({ botId, date: dateVal }).lean();
      const isFree = slotFree(startMins, duration, daySlots);

      if (isFree) {
        await BookedSlot.create({
          botId,
          telegramUserId,
          date: dateVal,
          timeFrom: timeVal,
          timeTo,
          variables: { ...session.variables },
        });
        const edge = edges.find((e) => e.source === node.id && e.sourceHandle === 'free');
        nodeId = edge ? edge.target : null;
      } else {
        const edge = edges.find((e) => e.source === node.id && e.sourceHandle === 'taken');
        nodeId = edge ? edge.target : null;
      }
      continue;
    }

    if (node.type === 'condition') {
      const val = session.variables[node.data.variableName];
      const match = evalCondition(val, node.data.condition, node.data.value);
      const edge = edges.find((e) => e.source === node.id && e.sourceHandle === (match ? 'true' : 'false'));
      nodeId = edge ? edge.target : null;
      continue;
    }

    if (node.type === 'multiCondition') {
      const conditions = node.data.conditions || [];
      let matched = false;
      for (const cond of conditions) {
        const val = session.variables[cond.variableName];
        if (evalCondition(val, cond.condition, cond.value)) {
          const edge = edges.find((e) => e.source === node.id && e.sourceHandle === cond.id);
          nodeId = edge ? edge.target : null;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const edge = edges.find((e) => e.source === node.id && e.sourceHandle === 'else');
        nodeId = edge ? edge.target : null;
      }
      continue;
    }

    if (node.type === 'saveData') {
      const varName = node.data.variableName;
      const value = interpolate(node.data.value, session.variables);
      if (varName) {
        session.variables[varName] = value;
        session.markModified('variables');
      }
      nodeId = nextNodeId(edges, node.id);
      continue;
    }

    if (node.type === 'notification') {
      const msg = interpolate(node.data.text, session.variables);
      const adminId = bot.adminChatId;
      if (adminId) {
        actions.push({ type: 'notify', chatId: adminId, text: msg });
      }
      nodeId = nextNodeId(edges, node.id);
      continue;
    }

    break;
  }

  session.updatedAt = new Date();
  await session.save();
  return actions;
}

async function resetSession(botId, telegramUserId) {
  await TelegramSession.findOneAndUpdate(
    { botId, telegramUserId },
    { currentNodeId: null, variables: {} },
    { new: true }
  );
}

module.exports = { handleMessage, resetSession };
