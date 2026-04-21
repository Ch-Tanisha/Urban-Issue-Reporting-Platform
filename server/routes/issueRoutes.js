const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getIssuesByBlock,
  updateIssueStatus,
  toggleDuplicate,
  getAllIssues,
  deleteIssue
} = require('../controllers/issueController');
const { protect, citizenOnly, officerOnly, adminOnly } = require('../middleware/authMiddleware');

// ---- Citizen routes ----
// POST /api/issues/create — Submit a new issue with optional photo
router.post('/create', protect, citizenOnly, (req, res, next) => {
  const upload = req.app.get('upload');
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, createIssue);

// GET /api/issues/my — Get issues reported by the logged-in citizen
router.get('/my', protect, citizenOnly, getMyIssues);

// ---- Admin-only routes (must come before /:id routes) ----
// GET /api/issues/all — Get all issues (with optional filters)
router.get('/all', protect, adminOnly, getAllIssues);

// ---- Officer & Admin shared routes ----
// GET /api/issues/block — Get issues for officer's assigned block
router.get('/block', protect, officerOnly, getIssuesByBlock);

// PUT /api/issues/:id/status — Update status (officer OR admin)
router.put('/:id/status', protect, (req, res, next) => {
  if (req.user.role === 'blockofficer' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Officers and Admins only.' });
}, updateIssueStatus);

// PUT /api/issues/:id/duplicate — Toggle duplicate flag (officer OR admin)
router.put('/:id/duplicate', protect, (req, res, next) => {
  if (req.user.role === 'blockofficer' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Officers and Admins only.' });
}, toggleDuplicate);

// DELETE /api/issues/:id — Delete an issue (admin only)
router.delete('/:id', protect, adminOnly, deleteIssue);

module.exports = router;

