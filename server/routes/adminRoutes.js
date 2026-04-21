const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  getAllCitizens,
  deleteCitizen,
  deleteAllCitizens
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET  /api/admin/analytics          — Platform-wide analytics + monthly trend
router.get('/analytics', protect, adminOnly, getAnalytics);

// GET  /api/admin/officers           — List all block officers
router.get('/officers', protect, adminOnly, getAllOfficers);

// POST /api/admin/officers           — Create a new block officer
router.post('/officers', protect, adminOnly, createOfficer);

// PUT  /api/admin/officers/:id       — Update a block officer
router.put('/officers/:id', protect, adminOnly, updateOfficer);

// DELETE /api/admin/officers/:id     — Delete a block officer
router.delete('/officers/:id', protect, adminOnly, deleteOfficer);

// GET  /api/admin/citizens           — List all citizens
router.get('/citizens', protect, adminOnly, getAllCitizens);

// DELETE /api/admin/citizens/all      — Delete ALL citizens + their issues
router.delete('/citizens/all', protect, adminOnly, deleteAllCitizens);

// DELETE /api/admin/citizens/:id     — Delete a citizen account + their issues
router.delete('/citizens/:id', protect, adminOnly, deleteCitizen);

module.exports = router;
