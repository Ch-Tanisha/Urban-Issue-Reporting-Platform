const express = require('express');
const router  = express.Router();
const {
  registerCitizen,
  loginUser,
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// ── Registration ──────────────────────────────────────────────────────────────
// Only citizen & officer can self-register.  Admin creation is admin-only.
router.post('/register', registerCitizen);

// ── Role-specific Login endpoints ─────────────────────────────────────────────
// Each endpoint validates the role before issuing a role-specific JWT.
router.post('/login/citizen', loginCitizen);
router.post('/login/officer', loginOfficer);
router.post('/login/admin',   loginAdmin);

// ── Legacy unified login (backward compatibility) ─────────────────────────────
router.post('/login', loginUser);

// ── Password reset flow ───────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// ── Protected profile routes ──────────────────────────────────────────────────
router.get('/me',       protect, getMe);
router.put('/profile',  protect, updateProfile);
router.put('/password', protect, changePassword);

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('uv_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
