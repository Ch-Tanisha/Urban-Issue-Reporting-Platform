const express = require('express');
const router  = express.Router();
const {
  registerCitizen,
  loginUser,
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe
} = require('../controllers/authController');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);

router.post('/login/citizen', loginCitizen);
router.post('/login/officer', loginOfficer);
router.post('/login/admin',   loginAdmin);

router.post('/login', loginUser);

router.get('/me',       protect, getMe);
router.put('/profile',  protect, updateProfile);
router.put('/password', protect, changePassword);

router.post('/logout', (req, res) => {
  res.clearCookie('uv_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
