const Notification = require('../models/Notification');
const Issue = require('../models/Issue');
const User = require('../models/User');

// Fetch all notifications belonging to the logged-in user, newest first
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark one notification as read (called when the user clicks on it)
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notif.isRead = true;
    await notif.save();
    res.json(notif);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// Mark all of the current user's notifications as read at once
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

// Remove a single notification permanently
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// ── Internal helpers (used by other controllers, not exposed as routes) ───────

// Send a notification to a single user
const createNotification = async (userId, message, type = 'system', issueId = null, issueTitle = '') => {
  try {
    await Notification.create({ user: userId, message, type, issueId, issueTitle });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// Send a notification to every block officer assigned to a specific block.
// This is called when a citizen creates a new issue so the relevant
// officer(s) are immediately aware.
const notifyOfficersInBlock = async (block, message, type = 'new_issue', issueId = null, issueTitle = '') => {
  try {
    // Find all users with the blockofficer role whose block field matches
    const officers = await User.find({ role: 'blockofficer', block });
    for (const officer of officers) {
      await Notification.create({
        user: officer._id,
        message,
        type,
        issueId,
        issueTitle
      });
    }
  } catch (err) {
    console.error('Failed to notify officers in block:', err.message);
  }
};

// Send a notification to all admin users (used for important system events)
const notifyAllAdmins = async (message, type = 'system', issueId = null, issueTitle = '') => {
  try {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        message,
        type,
        issueId,
        issueTitle
      });
    }
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  createNotification,
  notifyOfficersInBlock,
  notifyAllAdmins
};
