const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/** Return the correct JWT secret for a given role */
const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':       return process.env.JWT_SECRET_ADMIN   || process.env.JWT_SECRET;
    case 'blockofficer':return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':     return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:            return process.env.JWT_SECRET;
  }
};

/** Sign a JWT embedding id + role, using the role-specific secret */
const generateToken = (id, role) => {
  const secret = getRoleSecret(role);
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

/** Set an httpOnly cookie carrying the JWT (7-day expiry) */
const setAuthCookie = (res, token) => {
  res.cookie('uv_token', token, {
    httpOnly: true,                                         // not accessible via JS — prevents XSS theft
    secure:   process.env.NODE_ENV === 'production',        // HTTPS only in prod
    sameSite: 'lax',                                        // allows cross-port on localhost
    path:     '/',                                          // available on all routes
    maxAge:   7 * 24 * 60 * 60 * 1000                      // 7 days in ms
  });
};

/** Build the standard user response payload */
const userPayload = (user) => ({
  id:      user._id,
  name:    user.name,
  email:   user.email,
  role:    user.role,
  phone:   user.phone  || '',
  block:   user.block  || '',
  address: user.address || '',
  city:    user.city    || ''
});

// ─────────────────────────────────────────────
//  Register  (citizen & officer only — NO admin)
// ─────────────────────────────────────────────

// @desc    Register a new citizen or block officer
// @route   POST /api/auth/register
// @access  Public
const registerCitizen = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      role, age, gender, address, city, pincode, block
    } = req.body;

    // ── Block public admin creation ──────────────────────────────────────
    if (role === 'admin') {
      return res.status(403).json({
        message: 'Admin accounts cannot be created through public registration. Contact an existing administrator.'
      });
    }

    // ── Duplicate-email check ────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists. Please log in or use a different email.'
      });
    }

    // ── Determine role ───────────────────────────────────────────────────
    let userRole = 'citizen';
    if (role === 'blockofficer' || role === 'officer') {
      userRole = 'blockofficer';
    }

    // ── Hash password ────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create user ──────────────────────────────────────────────────────
    const user = await User.create({
      name,
      email:    email.toLowerCase(),
      password: hashedPassword,
      phone:    phone    || '',
      role:     userRole,
      age:      age      || null,
      gender:   gender   || '',
      address:  address  || '',
      city:     city     || '',
      pincode:  pincode  || '',
      block:    block    || ''
    });

    // ── Token + Cookie ───────────────────────────────────────────────────
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    res.status(201).json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─────────────────────────────────────────────
//  Role-specific Login endpoints
// ─────────────────────────────────────────────

// @desc    Login as Citizen
// @route   POST /api/auth/login/citizen
// @access  Public
const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });

    // Role mismatch — give a helpful, specific message
    if (user.role !== 'citizen') {
      const label = user.role === 'blockofficer' ? 'Block Officer' : 'Administrator';
      return res.status(403).json({
        message: `This email is registered as a ${label}. Please use the correct login option.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Citizen login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Login as Block Officer
// @route   POST /api/auth/login/officer
// @access  Public
const loginOfficer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });

    if (user.role !== 'blockofficer') {
      const label = user.role === 'admin' ? 'Administrator' : 'Citizen';
      return res.status(403).json({
        message: `This email is registered as a ${label}. Please use the correct login option.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Officer login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Login as Admin
// @route   POST /api/auth/login/admin
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'No admin account found with this email.' });

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'This account does not have administrator privileges. Please use the correct login option.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Legacy unified login (kept for backward compatibility)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'User not found. Please register first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password.' });

    // Role mismatch check
    if (role) {
      const frontendRole = role === 'officer' ? 'blockofficer' : role;
      if (user.role !== frontendRole) {
        return res.status(403).json({
          message: `This account is registered as "${user.role}", not "${role}". Please select the correct role.`
        });
      }
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────
//  Get current user
// ─────────────────────────────────────────────

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
//  Forgot / Reset Password
// ─────────────────────────────────────────────

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success-style message to avoid user enumeration
    if (!user) {
      return res.json({
        message: 'If this email exists, a password reset link/token has been generated.'
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const response = {
      message: 'If this email exists, a password reset link/token has been generated.'
    };

    // Developer-friendly response for local testing when email delivery is not configured.
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = rawToken;
      response.resetHint = 'Use this token in the reset form. In production, send this token by email.';
    }

    return res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error while requesting password reset.' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error while resetting password.' });
  }
};

module.exports = {
  registerCitizen,
  loginUser,
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe,
  forgotPassword,
  resetPassword
};
