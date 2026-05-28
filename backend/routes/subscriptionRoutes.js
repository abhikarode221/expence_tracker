const express = require('express');
const router = express.Router();
const { getSubscriptions, deleteSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSubscriptions);
router.delete('/:id', protect, deleteSubscription);

module.exports = router;