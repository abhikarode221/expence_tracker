const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser,
  updateBudget // 🟢 added new controller
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// =========================
// AUTH ROUTES
// =========================

// POST /api/users/register
router.post('/register', registerUser);

// POST /api/users/login
router.post('/login', loginUser);

// =========================
// USER SETTINGS ROUTES
// =========================

// PUT /api/users/budget (protected)
router.put('/budget', protect, updateBudget);

module.exports = router;