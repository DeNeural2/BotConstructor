const mongoose = require('mongoose');

// Tracks where each Telegram user is in the bot's flow
const sessionSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  telegramUserId: { type: Number, required: true },
  currentNodeId: { type: String },
  variables: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

sessionSchema.index({ botId: 1, telegramUserId: 1 }, { unique: true });

module.exports = mongoose.model('TelegramSession', sessionSchema);
