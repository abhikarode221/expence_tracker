const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // 🟢 Currency preference
  currency: { type: String, default: 'INR' },

  // 🟢 New Field for Budgeting
  monthlyBudget: { type: Number, default: 5000 },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);