const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Removed the .js extension as it's standard in CommonJS

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user (excluding password) to request object
      req.user = await User.findById(decoded.id).select('-password');

      return next();

    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized, token failed',
      });
    }
  }

  // No token provided
  return res.status(401).json({
    message: 'Not authorized, no token',
  });
};

// This is the most important part for CommonJS!
module.exports = { protect };