const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':
      return process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET;
    case 'blockofficer':
      return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':
      return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:
      return process.env.JWT_SECRET;
  }
};

const generateToken = (id, role) => {
  const secret = getRoleSecret(role);
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

const setAuthCookie = (res, token) => {
  res.cookie('uv_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  block: user.block || '',
  address: user.address || '',
  city: user.city || '',
});

const registerCitizen = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      age,
      gender,
      address,
      city,
      pincode,
      block,
    } = req.body;

    if (role === 'admin') {
      return res.status(403).json({
        message: 'Admin accounts cannot be created through public registration. Contact an existing administrator.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists. Please log in or use a different email.',
      });
    }

    let userRole = 'citizen';
    if (role === 'blockofficer' || role === 'officer') {
      userRole = 'blockofficer';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: userRole,
      age: age || null,
      gender: gender || '',
      address: address || '',
      city: city || '',
      pincode: pincode || '',
      block: block || '',
    });

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    res.status(201).json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });
    }

    if (user.role !== 'citizen') {
      const label = user.role === 'blockofficer' ? 'Block Officer' : 'Administrator';
      return res.status(403).json({
        message: `This email is registered as a ${label}. Please use the correct login option.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Citizen login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const loginOfficer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });
    }

    if (user.role !== 'blockofficer') {
      const label = user.role === 'admin' ? 'Administrator' : 'Citizen';
      return res.status(403).json({
        message: `This email is registered as a ${label}. Please use the correct login option.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Officer login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No admin account found with this email.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'This account does not have administrator privileges. Please use the correct login option.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    if (role) {
      const frontendRole = role === 'officer' ? 'blockofficer' : role;
      if (user.role !== frontendRole) {
        return res.status(403).json({
          message: `This account is registered as "${user.role}", not "${role}". Please select the correct role.`,
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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerCitizen,
  loginUser,
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe,
};
