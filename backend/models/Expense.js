const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  description: { 
    type: String, 
    required: true 
  },

  totalAmount: { 
    type: Number, 
    required: true 
  },

  // ✅ Category Field
  category: {
    type: String,
    required: true,
    enum: [
      'Food',
      'Transport',
      'Rent',
      'Shopping',
      'Entertainment',
      'Bills',
      'Others'
    ],
    default: 'Others'
  },

  // ✅ New Fields
  date: {
    type: Date,
    default: Date.now
  },

  note: {
    type: String,
    maxLength: 200
  },

  isRecurring: {
    type: Boolean,
    default: false
  },

  // ✅ Splits
  splits: [
    {
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },

      email: { 
        type: String 
      },

      amount: { 
        type: Number, 
        required: true 
      },

      isPaid: { 
        type: Boolean, 
        default: false 
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);