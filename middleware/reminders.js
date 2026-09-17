const cron       = require('node-cron');
const nodemailer = require('nodemailer');
const Task       = require('../models/Task');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendReminderEmail(task) {
  const due = task.dueDate
    ? new Date(task.dueDate).toDateString()
    : 'No due date set';

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">
      <h2 style="color:#1f2937;margin:0 0 4px">⏰ Task Reminder</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Mazad · Zoho Project Tracker</p>

      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:18px;margin-bottom:16px">
        <div style="font-size:12px;color:#9ca3af;margin-bottom:4px">M${task.milestoneId} · ${task.milestone}</div>
        <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:12px">${task.task}</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <span style="background:#eff6ff;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${task.status}</span>
          <span style="background:#f9fafb;color:#374151;padding:3px 10px;border-radius:20px;font-size:12px">Due: ${due}</span>
          <span style="background:#f9fafb;color:#374151;padding:3px 10px;border-radius:20px;font-size:12px">Priority: ${task.priority}</span>
        </div>
      </div>

      ${task.reminderNote ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px;font-size:13px;color:#92400e"><strong>Note:</strong> ${task.reminderNote}</div>` : ''}

      <p style="color:#9ca3af;font-size:11px;margin-top:20px;text-align:center">Mazad · Zoho Project Tracker — automated reminder</p>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.REMINDER_FROM,
    to:      task.reminderEmail,
    subject: `⏰ Reminder: ${task.task.substring(0, 60)}${task.task.length > 60 ? '…' : ''}`,
    html,
  });
}

async function checkReminders({ digest = false } = {}) {
  let sent = 0;
  const now  = new Date();

  // Find reminders that are due and not yet sent (including any missed earlier)
  const due = await Task.find({
    reminderDate: { $lte: now },
    reminderSent: false,
    reminderEmail: { $exists: true, $ne: '' },
  });

  for (const task of due) {
    try {
      await sendReminderEmail(task);
      task.reminderSent = true;
      await task.save();
      sent++;
      console.log(`[Reminder] Sent for Task #${task.taskId}`);
    } catch (emailErr) {
      console.error(`[Reminder] Failed for Task #${task.taskId}:`, emailErr.message);
    }
  }

  // Overdue digest — once a day
  if (digest) {
    const overdue = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['Completed'] },
      reminderEmail: { $exists: true, $ne: '' },
    });
    if (overdue.length > 0) {
      const uniqueEmails = [...new Set(overdue.map(t => t.reminderEmail).filter(Boolean))];
      for (const email of uniqueEmails) {
        const tasks = overdue.filter(t => t.reminderEmail === email);
        try {
          await transporter.sendMail({
            from:    process.env.REMINDER_FROM,
            to:      email,
            subject: `🚨 ${tasks.length} Overdue Task${tasks.length > 1 ? 's' : ''} — Mazad Zoho Tracker`,
            html: `
              <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#b91c1c">🚨 Overdue Tasks Report</h2>
                <p style="color:#6b7280">The following tasks are past their due date:</p>
                ${tasks.map(t => `
                  <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:6px;padding:12px;margin-bottom:8px">
                    <div style="font-size:11px;color:#9ca3af">M${t.milestoneId} · Due: ${new Date(t.dueDate).toDateString()}</div>
                    <div style="font-weight:600;color:#111827">${t.task}</div>
                    <div style="font-size:12px;color:#dc2626;margin-top:4px">${t.status} · ${t.priority} Priority</div>
                  </div>
                `).join('')}
              </div>
            `,
          });
        } catch (e) {
          console.error('[Digest] Failed:', e.message);
        }
      }
    }
  }
  return { remindersSent: sent };
}

function startReminderCron() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      await checkReminders({ digest: now.getHours() === 9 && now.getMinutes() < 15 });
    } catch (err) {
      console.error('[Cron] Error:', err.message);
    }
  });

  console.log('[Reminders] Cron scheduler started (every 15 min)');
}

module.exports = { startReminderCron, checkReminders };
