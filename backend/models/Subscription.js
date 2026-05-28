const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // e.g., "Netflix"
  amount: { type: Number, required: true },
  category: { type: String, default: 'Bills' },
  billingDate: { type: Number, required: true, min: 1, max: 31 }, // Day of month
  lastProcessed: { type: Date }, // To prevent double-charging in the same month
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);