const BlockOfficer = require('../models/BlockOfficer');
const Issue = require('../models/Issue');

// @desc    Get current officer's profile
// @route   GET /api/block/profile
// @access  Private (Officer)
const getOfficerProfile = async (req, res) => {
  try {
    const profile = await BlockOfficer.findOne({ userId: req.user._id });

    if (!profile) {
      // Fallback: return basic info from User model
      return res.json({
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        assignedBlock: req.user.block || '',
        avatar: req.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get officer profile error:', error);
    res.status(500).json({ message: 'Failed to fetch officer profile' });
  }
};

// @desc    Get issues assigned to officer's block
// @route   GET /api/block/issues
// @access  Private (Officer)
const getAssignedIssues = async (req, res) => {
  try {
    const profile = await BlockOfficer.findOne({ userId: req.user._id });
    const block = profile ? profile.assignedBlock : req.user.block;

    if (!block) {
      return res.status(400).json({ message: 'No block assigned to this officer' });
    }

    const issues = await Issue.find({ block })
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get assigned issues error:', error);
    res.status(500).json({ message: 'Failed to fetch assigned issues' });
  }
};

// @desc    Get analytics for officer's block
// @route   GET /api/block/analytics
// @access  Private (Officer)
const getBlockAnalytics = async (req, res) => {
  try {
    const profile = await BlockOfficer.findOne({ userId: req.user._id });
    const block = profile ? profile.assignedBlock : req.user.block;

    if (!block) {
      return res.status(400).json({ message: 'No block assigned to this officer' });
    }

    const total      = await Issue.countDocuments({ block });
    const reported   = await Issue.countDocuments({ block, status: 'Reported' });
    const inProgress = await Issue.countDocuments({ block, status: 'In Progress' });
    const resolved   = await Issue.countDocuments({ block, status: 'Resolved' });

    const byCategory = await Issue.aggregate([
      { $match: { block } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byPriority = await Issue.aggregate([
      { $match: { block } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      block,
      total,
      statusCounts: { reported, inProgress, resolved },
      byCategory,
      byPriority
    });
  } catch (error) {
    console.error('Block analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch block analytics' });
  }
};

module.exports = { getOfficerProfile, getAssignedIssues, getBlockAnalytics };
