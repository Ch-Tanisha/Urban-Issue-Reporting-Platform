const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Block officer only middleware
const officerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'blockofficer') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Block Officer only.' });
  }
};

// Citizen only middleware
const citizenOnly = (req, res, next) => {
  if (req.user && req.user.role === 'citizen') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Citizen only.' });
  }
};

module.exports = { protect, adminOnly, officerOnly, citizenOnly };
