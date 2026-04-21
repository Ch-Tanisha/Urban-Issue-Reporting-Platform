const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications — Get all notifications for logged-in user
router.get('/', protect, getMyNotifications);

// PUT /api/notifications/read-all — Mark all as read (must come before /:id)
router.put('/read-all', protect, markAllRead);

// PUT /api/notifications/:id/read — Mark single as read
router.put('/:id/read', protect, markAsRead);

// DELETE /api/notifications/:id — Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
