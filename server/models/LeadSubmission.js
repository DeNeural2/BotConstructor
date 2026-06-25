const mongoose = require('mongoose');

const leadSubmissionSchema = new mongoose.Schema({
  botId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true, index: true },
  data:      { type: mongoose.Schema.Types.Mixed, default: {} },
  notified:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

leadSubmissionSchema.index({ botId: 1, createdAt: -1 });

module.exports = mongoose.model('LeadSubmission', leadSubmissionSchema);
