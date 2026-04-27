const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Resolve verification secret using the role embedded in the token.
const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':        return process.env.JWT_SECRET_ADMIN   || process.env.JWT_SECRET;
    case 'blockofficer': return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':      return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:             return process.env.JWT_SECRET;
  }
};

// Authenticate requests for protected routes.
const protect = async (req, res, next) => {
  let token;

  // Primary source: Authorization header.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback source: httpOnly auth cookie.
  else if (req.cookies && req.cookies.uv_token) {
    token = req.cookies.uv_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }

  try {
    // Decode to read role, then verify signature with role-specific secret.
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized — malformed token.' });
    }

    const secret = getRoleSecret(decoded.role);
    const verified = jwt.verify(token, secret);

    // Attach authenticated user to request context.
    req.user = await User.findById(verified.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — user no longer exists.' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Administrators only.' });
};

const officerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'blockofficer') return next();
  return res.status(403).json({ message: 'Access denied. Block Officers only.' });
};

const citizenOnly = (req, res, next) => {
  if (req.user && req.user.role === 'citizen') return next();
  return res.status(403).json({ message: 'Access denied. Citizens only.' });
};

module.exports = { protect, adminOnly, officerOnly, citizenOnly };
