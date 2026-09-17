const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId:      { type: Number, required: true, unique: true },
  milestoneId: { type: Number, required: true },
  milestone:   { type: String, required: true },
  task:        { type: String, required: true },
  status:      {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold'],
    default: 'Not Started'
  },
  priority:    {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  startDate:   { type: Date, default: null },
  dueDate:     { type: Date, default: null },
  notes:       { type: String, default: '' },
  // Reminder fields — shown as in-app notifications once reminderDate passes.
  // reminderSent = the notification was dismissed ("Done") in the app.
  reminderDate:    { type: Date, default: null },
  reminderSent:    { type: Boolean, default: false },
  reminderNote:    { type: String, default: '' },
}, {
  timestamps: true   // adds createdAt, updatedAt
});

// Index for fast milestone queries
taskSchema.index({ milestoneId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ reminderDate: 1, reminderSent: 1 });

module.exports = mongoose.model('Task', taskSchema);
