const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const User = require('../models/User');

/* =========================
   ADD EXPENSE
========================= */
// @desc    Add a new split or personal expense
// @route   POST /api/expenses
exports.addExpense = async (req, res) => {
  const { description, totalAmount, splits, category } = req.body;

  try {
    if (!description || !totalAmount) {
      return res.status(400).json({
        message: 'Please provide description and totalAmount',
      });
    }

    const processedSplits =
      splits && splits.length > 0
        ? await Promise.all(
            splits.map(async (split) => {
              const foundUser = await User.findOne({
                email: { $regex: new RegExp(`^${split.email}$`, 'i') }
              });

              return {
                user: foundUser ? foundUser._id : null,
                email: split.email.toLowerCase(),
                amount: split.amount,
                isPaid: false
              };
            })
          )
        : [];

    const expense = await Expense.create({
      creator: req.user._id,
      description,
      totalAmount,
      category: category || 'Others',
      splits: processedSplits,
    });

    // Create in-app notification for split participants
    if (processedSplits.length > 0) {
      const Notification = require('../models/Notification');
      await Promise.all(
        processedSplits.map(async (split) => {
          if (split.user) {
            await Notification.create({
              user: split.user,
              title: 'New Shared Expense',
              message: `${req.user.name} shared a new expense: "${description}". Your share is ${split.amount}.`,
              type: 'info'
            });
          }
        })
      );
    }

    res.status(201).json(expense);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   MY EXPENSES
========================= */
// @desc    Get expenses created by current user
// @route   GET /api/expenses/my-expenses
exports.getMyExpenses = async (req, res) => {
  try {

    const expenses = await Expense.find({
      creator: req.user._id
    }).sort({ createdAt: -1 });

    res.json(expenses);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   SHARED EXPENSES
========================= */
// @desc    Get expenses shared WITH current user
// @route   GET /api/expenses/shared
exports.getSharedExpenses = async (req, res) => {
  try {

    const shared = await Expense.find({
      'splits.user': req.user._id,
    })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    res.json(shared);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   SETTLE EXPENSE
========================= */
// @desc    Mark split as paid
// @route   PUT /api/expenses/:id/settle
exports.settleExpense = async (req, res) => {
  try {

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    const split = expense.splits.find(
      (s) => s.user && s.user.toString() === req.user._id.toString()
    );

    if (!split) {
      return res.status(404).json({
        message: 'Split not found for this user'
      });
    }

    if (split.isPaid) {
      return res.status(400).json({
        message: 'Expense already settled'
      });
    }

    split.isPaid = true;

    await expense.save();

    // Create in-app notification for the creator of the expense
    const Notification = require('../models/Notification');
    await Notification.create({
      user: expense.creator,
      title: 'Split Settled',
      message: `${req.user.name} settled their split of ${split.amount} for "${expense.description}".`,
      type: 'success'
    });

    res.json({
      message: 'Expense settled successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE EXPENSE
========================= */
// @desc    Update an expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    // ✅ Security: Only creator can edit
    if (expense.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: 'Not authorized to edit this'
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedExpense);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   DELETE EXPENSE
========================= */
// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    // ✅ Security: Only creator can delete
    if (expense.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        message: 'Not authorized to delete this'
      });
    }

    await expense.deleteOne();

    res.json({
      message: 'Expense removed'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   DEBT SUMMARY
========================= */
// @desc    Get total money owed to and by the user
// @route   GET /api/expenses/debt-summary
exports.getDebtSummary = async (req, res) => {
  try {

    const userId = req.user._id;

    const ownedToMeExpenses = await Expense.find({
      creator: userId
    });

    let peopleOweMe = 0;

    ownedToMeExpenses.forEach(exp => {
      exp.splits.forEach(split => {
        if (!split.isPaid) {
          peopleOweMe += split.amount;
        }
      });
    });

    const sharedWithMe = await Expense.find({
      'splits.user': userId
    });

    let iOwe = 0;

    sharedWithMe.forEach(exp => {
      const mySplit = exp.splits.find(
        s => s.user && s.user.toString() === userId.toString()
      );

      if (mySplit && !mySplit.isPaid) {
        iOwe += mySplit.amount;
      }
    });

    res.json({
      peopleOweMe,
      iOwe
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   CATEGORY STATS
========================= */
// @desc    Get category-wise spending stats
// @route   GET /api/expenses/category-stats
exports.getCategoryStats = async (req, res) => {
  try {

    const stats = await Expense.aggregate([
      {
        $match: {
          // ✅ Cast to MongoDB ObjectId
          creator: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $group: {
          // ✅ Fallback for old expenses without category
          _id: {
            $ifNull: ["$category", "Others"]
          },
          total: {
            $sum: "$totalAmount"
          }
        }
      }
    ]);

    // ✅ Format for charts
    const formattedStats = stats.map(item => ({
      name: item._id,
      value: item.total
    }));

    res.json(formattedStats);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};