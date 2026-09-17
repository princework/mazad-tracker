const express  = require('express');
const router   = express.Router();
const Feedback = require('../models/Feedback');
const Task     = require('../models/Task');
const { requireAdmin } = require('../middleware/auth');

// GET all feedback (optional ?milestoneId=&status=), newest first
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.milestoneId) filter.milestoneId = Number(req.query.milestoneId);
    if (req.query.status)      filter.status      = req.query.status;
    const items = await Feedback.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new feedback — open to the client link
router.post('/', async (req, res) => {
  try {
    const milestoneId = Number(req.body.milestoneId);
    const taskId      = req.body.taskId ? Number(req.body.taskId) : null;

    // Milestone/task names come from the DB, never from the client
    const ref = await Task.findOne(taskId ? { taskId, milestoneId } : { milestoneId }).lean();
    if (!ref) return res.status(400).json({ success: false, message: 'Unknown milestone or task' });

    const item = await Feedback.create({
      milestoneId,
      milestone: ref.milestone,
      taskId,
      task:      taskId ? ref.task : '',
      author:    req.body.author,
      message:   req.body.message,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH status / reply — developers only
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.reply  !== undefined) {
      update.reply     = req.body.reply;
      update.repliedAt = req.body.reply ? new Date() : null;
    }
    const item = await Feedback.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE — developers only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Feedback.findByIdAndDelete(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
