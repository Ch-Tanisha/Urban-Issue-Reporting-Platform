const express = require('express');
const router = express.Router();
const { registerCitizen, loginUser, getMe } = require('../controllers/authController');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Register new user
router.post('/register', registerCitizen);

// POST /api/auth/login — Login user
router.post('/login', loginUser);

// GET /api/auth/me — Get current user profile
router.get('/me', protect, getMe);

// PUT /api/auth/profile — Update user profile (name, phone, address, etc.)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/password — Change user password
router.put('/password', protect, changePassword);

module.exports = router;
