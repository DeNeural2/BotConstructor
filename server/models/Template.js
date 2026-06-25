const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  previewImageUrl: String,
  flow: { type: mongoose.Schema.Types.Mixed, default: [] },
});

module.exports = mongoose.model('Template', templateSchema);
