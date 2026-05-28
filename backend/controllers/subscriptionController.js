const Subscription = require('../models/Subscription');

exports.getSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id }).sort({ billingDate: 1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ message: "Subscription removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};