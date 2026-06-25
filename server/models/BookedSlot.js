const mongoose = require('mongoose');

const bookedSlotSchema = new mongoose.Schema({
  botId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true, index: true },
  telegramUserId: { type: Number, required: true },
  date:           { type: String, required: true },   // "dd.mm.yyyy"
  timeFrom:       { type: String, required: true },   // "hh:mm"
  timeTo:         { type: String, required: true },   // "hh:mm"
  variables:      { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:      { type: Date, default: Date.now },
});

bookedSlotSchema.index({ botId: 1, date: 1 });

module.exports = mongoose.model('BookedSlot', bookedSlotSchema);
