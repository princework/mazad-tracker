const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const Feedback = require('../models/Feedback');
const { requireAdmin } = require('../middleware/auth');

// Shared by both create routes; taskId continues from the highest one in use
async function createTask({ milestoneId, milestone, task, status, priority, startDate, notes }) {
  const text = String(task || '').trim();
  if (!text) throw new Error('Task name is required');
  const last = await Task.findOne().sort({ taskId: -1 }).lean();
  return Task.create({
    taskId: (last?.taskId || 0) + 1,
    milestoneId,
    milestone,
    task: text,
    ...(status   ? { status }   : {}),
    ...(priority ? { priority } : {}),
    ...(startDate ? { startDate } : {}),
    ...(notes     ? { notes }     : {}),
  });
}

// GET all tasks (optional ?milestoneId=&status= filters)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.milestoneId) filter.milestoneId = Number(req.query.milestoneId);
    if (req.query.status)      filter.status      = req.query.status;
    const tasks = await Task.find(filter).sort({ taskId: 1 }).lean();
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ taskId: Number(req.params.id) }).lean();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update a task (partial update) — developers only
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['status','priority','startDate','notes','task'];
    const update = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) update[key] = req.body[key]; });

    const task = await Task.findOneAndUpdate(
      { taskId: Number(req.params.id) },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET dashboard summary
router.get('/meta/summary', async (req, res) => {
  try {
    const [statusAgg, msAgg, feedbackOpen, feedbackTotal] = await Promise.all([
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([
        { $group: {
            _id: { milestoneId: '$milestoneId', milestone: '$milestone', status: '$status' },
            count: { $sum: 1 }
          }
        },
        { $group: {
            _id: { milestoneId: '$_id.milestoneId', milestone: '$_id.milestone' },
            statuses: { $push: { status: '$_id.status', count: '$count' } },
            total: { $sum: '$count' }
          }
        },
        { $sort: { '_id.milestoneId': 1 } }
      ]),
      Feedback.countDocuments({ status: 'Open' }),
      Feedback.countDocuments(),
    ]);

    const statusMap = {};
    statusAgg.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        total:      Object.values(statusMap).reduce((a,b)=>a+b,0),
        pending:    statusMap['Pending']     || 0,
        inProgress: statusMap['In Progress']  || 0,
        completed:  statusMap['Completed']    || 0,
        onHold:     statusMap['On Hold']      || 0,
        feedbackOpen,
        feedbackTotal,
        milestones: msAgg,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST a new task in an existing milestone — developers only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const milestoneId = Number(req.body.milestoneId);
    const sibling = await Task.findOne({ milestoneId }).lean();
    if (!sibling) return res.status(400).json({ success: false, message: 'Unknown milestone' });
    const task = await createTask({ ...req.body, milestoneId, milestone: sibling.milestone });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST a new milestone with its first task — developers only
router.post('/milestone', requireAdmin, async (req, res) => {
  try {
    const milestone = String(req.body.milestone || '').trim();
    if (!milestone) return res.status(400).json({ success: false, message: 'Milestone name is required' });

    const existing = await Task.findOne({ milestone: new RegExp(`^${milestone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
    if (existing) return res.status(409).json({ success: false, message: `Milestone “${existing.milestone}” already exists` });

    const last = await Task.findOne().sort({ milestoneId: -1 }).lean();
    const milestoneId = (last?.milestoneId || 0) + 1;
    const task = await createTask({ ...req.body, milestoneId, milestone });
    res.status(201).json({ success: true, data: { milestoneId, milestone, task } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE a whole milestone: all its tasks and their feedback — developers only, permanent
router.delete('/milestone/:milestoneId', requireAdmin, async (req, res) => {
  try {
    const milestoneId = Number(req.params.milestoneId);
    const tasksResult = await Task.deleteMany({ milestoneId });
    if (!tasksResult.deletedCount) return res.status(404).json({ success: false, message: 'Milestone not found' });
    const fbResult = await Feedback.deleteMany({ milestoneId });
    res.json({ success: true, data: { tasksDeleted: tasksResult.deletedCount, feedbackDeleted: fbResult.deletedCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a single task and its feedback — developers only, permanent
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const task   = await Task.findOneAndDelete({ taskId }).lean();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const fbResult = await Feedback.deleteMany({ taskId });
    res.json({ success: true, data: { task, feedbackDeleted: fbResult.deletedCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
