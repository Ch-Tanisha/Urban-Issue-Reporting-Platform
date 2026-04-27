const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Role → secret mapping ─────────────────────────────────────────────────────
const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':        return process.env.JWT_SECRET_ADMIN   || process.env.JWT_SECRET;
    case 'blockofficer': return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':      return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:             return process.env.JWT_SECRET;
  }
};

// ── Main auth middleware ──────────────────────────────────────────────────────
// Supports:
//   1. Authorization: Bearer <token>   (header — primary, used by Axios)
//   2. Cookie: uv_token=<token>        (httpOnly cookie — fallback)
const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: check httpOnly cookie
  else if (req.cookies && req.cookies.uv_token) {
    token = req.cookies.uv_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }

  try {
    // Decode without verifying first to read the embedded role
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized — malformed token.' });
    }

    // Pick the correct secret based on the embedded role, then verify
    const secret = getRoleSecret(decoded.role);
    const verified = jwt.verify(token, secret);

    // Attach user to request
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

// ── Role guards ───────────────────────────────────────────────────────────────
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
