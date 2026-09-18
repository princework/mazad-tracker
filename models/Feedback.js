const mongoose = require('mongoose');

// Client feedback on a milestone, optionally narrowed to one task inside it
const feedbackSchema = new mongoose.Schema({
  milestoneId: { type: Number, required: true, min: 1 },
  milestone:   { type: String, required: true },
  taskId:      { type: Number, default: null },
  task:        { type: String, default: '' },
  author:      { type: String, required: true, trim: true, maxlength: 80 },
  message:     { type: String, required: true, trim: true, maxlength: 2000 },
  status:      { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  // Developer response, visible to the client
  reply:       { type: String, default: '', trim: true, maxlength: 2000 },
  repliedAt:   { type: Date, default: null },
}, {
  timestamps: true
});

feedbackSchema.index({ milestoneId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
