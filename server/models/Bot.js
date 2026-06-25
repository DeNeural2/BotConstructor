const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['start', 'message', 'buttons', 'menu', 'question', 'condition', 'multiCondition', 'saveData', 'notification', 'booking', 'end'],
    required: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: String,
}, { _id: false });

const botSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tokenEncrypted: { type: String },
  adminChatId: { type: String },
  timezone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['active', 'stopped', 'error'], default: 'stopped' },
  nodes: { type: [nodeSchema], default: [] },
  edges: { type: [edgeSchema], default: [] },
  schedule: {
    enabled:      { type: Boolean, default: false },
    workDays:     { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Mon … 6=Sun
    workStart:    { type: String, default: '09:00' },
    workEnd:      { type: String, default: '18:00' },
    slotDuration: { type: Number, default: 60 },               // minutes
  },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

botSchema.pre('save', function () {
  this.updatedAt = new Date();
});

const SECRET = process.env.TOKEN_SECRET || 'changeme';

botSchema.methods.setToken = function (plainToken) {
  this.tokenEncrypted = CryptoJS.AES.encrypt(plainToken, SECRET).toString();
};

botSchema.methods.getToken = function () {
  if (!this.tokenEncrypted) return null;
  const bytes = CryptoJS.AES.decrypt(this.tokenEncrypted, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = mongoose.model('Bot', botSchema);
