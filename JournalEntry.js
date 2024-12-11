const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  title: { type: String, required: true }, // Title field
  text: { type: String, required: true },
  sentiment: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Associate with user
});

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry;
