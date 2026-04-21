const express = require('express');
const router = express.Router();
const { getOfficerProfile, getAssignedIssues, getBlockAnalytics } = require('../controllers/blockController');
const { protect, officerOnly } = require('../middleware/authMiddleware');

// GET /api/block/profile — Get officer's own profile
router.get('/profile', protect, officerOnly, getOfficerProfile);

// GET /api/block/issues — Get issues for officer's assigned block
router.get('/issues', protect, officerOnly, getAssignedIssues);

// GET /api/block/analytics — Get analytics for officer's assigned block
router.get('/analytics', protect, officerOnly, getBlockAnalytics);

module.exports = router;
