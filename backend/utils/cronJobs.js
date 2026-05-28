const cron = require('node-cron');

const Subscription = require('./models/Subscription');
const Expense = require('./models/Expense');
const Notification = require('../models/Notification');

// ==========================================
// DAILY SUBSCRIPTION AUTO-PAYMENT CHECK
// Runs every day at midnight (00:00)
// ==========================================
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily subscription check...');

  const today = new Date();
  const currentDay = today.getDate();

  try {
    // Find subscriptions due today
    const subscriptions = await Subscription.find({
      billingDate: currentDay
    });

    for (const sub of subscriptions) {

      // ✅ Prevent duplicate processing in same month
      const alreadyProcessed =
        sub.lastProcessed &&
        sub.lastProcessed.getMonth() === today.getMonth() &&
        sub.lastProcessed.getFullYear() === today.getFullYear();

      if (!alreadyProcessed) {

        // ✅ Create recurring expense
        await Expense.create({
          creator: sub.user,
          description: sub.name,
          totalAmount: sub.amount,
          category: sub.category,
          date: today,
          note: 'Automated recurring payment'
        });

        // ✅ Update last processed date
        sub.lastProcessed = today;
        await sub.save();

        console.log(
          `Auto-added expense: ${sub.name} for user ${sub.user}`
        );
      }
    }

  } catch (err) {
    console.error('Cron Error:', err);
  }
});

// ==========================================
// UPCOMING BILL REMINDER
// Runs every morning at 9:00 AM
// ==========================================
cron.schedule('0 9 * * *', async () => {
  console.log('Running upcoming bill reminder check...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDay = tomorrow.getDate();

  try {
    // ✅ Find subscriptions due tomorrow
    const upcomingSubs = await Subscription.find({
      billingDate: tomorrowDay
    });

    for (const sub of upcomingSubs) {

      // ✅ Create in-app notification
      await Notification.create({
        user: sub.user,
        title: 'Upcoming Bill',
        message: `Reminder: ${sub.name} (INR ${sub.amount}) is due tomorrow.`,
        type: 'warning'
      });

      console.log(`Reminder sent for ${sub.name}`);
    }

  } catch (err) {
    console.error('Reminder Cron Error:', err);
  }
});