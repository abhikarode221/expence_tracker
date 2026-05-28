const express = require('express');
const router = express.Router();

// ✅ Import ALL controllers
const {
  addExpense,
  getSharedExpenses,
  getMyExpenses,
  settleExpense,
  getDebtSummary,
  getCategoryStats,
  updateExpense,   // ✅ added
  deleteExpense    // ✅ added
} = require('../controllers/expenseController');

// ✅ Auth middleware
const { protect } = require('../middleware/authMiddleware');

/*
  🟢 STATIC ROUTES FIRST
  (Prevents route conflicts with dynamic params)
*/

// POST /api/expenses → Add new expense
router.post('/', protect, addExpense);

// GET /api/expenses/my-expenses → Expenses created by user
router.get('/my-expenses', protect, getMyExpenses);

// GET /api/expenses/shared → Expenses shared with user
router.get('/shared', protect, getSharedExpenses);

// GET /api/expenses/debt-summary
router.get('/debt-summary', protect, getDebtSummary);

// GET /api/expenses/category-stats
router.get('/category-stats', protect, getCategoryStats);

/*
  🔴 DYNAMIC ROUTES LAST
*/

// PUT /api/expenses/:id/settle → Mark split as paid
router.put('/:id/settle', protect, settleExpense);

// ✅ UPDATE + DELETE expense
router.route('/:id')
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

// Export router
module.exports = router;