const Issue = require('../models/Issue');
const BlockOfficer = require('../models/BlockOfficer');
const { createNotification, notifyOfficersInBlock, notifyAllAdmins } = require('./notificationController');

// @desc    Create a new issue (Citizen)
// @route   POST /api/issues/create
// @access  Private (Citizen)
const createIssue = async (req, res) => {
  try {
    const { title, description, category, priority, address, coordinates, block, citizenContact } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      address,
      coordinates: coordinates || '',
      block,
      status: 'Reported',
      photo: req.file ? `/uploads/${req.file.filename}` : '',
      reportedBy: req.user._id,
      citizenName: req.user.name,
      citizenContact: citizenContact || req.user.email,
      citizenPhone: req.user.phone || '',
      isDuplicate: false,
      reportedOn: new Date().toISOString().split('T')[0]
    });

    // Notify the citizen that their report was received
    await createNotification(
      req.user._id,
      `Your issue "${title}" has been submitted and is pending review.`,
      'new_issue',
      issue._id,
      title
    );

    // Let the block officer(s) in charge of this block know about the new issue
    await notifyOfficersInBlock(
      block,
      `New issue reported in ${block}: "${title}" (${category}, ${priority || 'Medium'} priority)`,
      'new_issue',
      issue._id,
      title
    );

    // For high-priority issues, also alert all admins
    if (priority === 'High') {
      await notifyAllAdmins(
        `High priority issue in ${block}: "${title}" — needs attention.`,
        'new_issue',
        issue._id,
        title
      );
    }

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ message: 'Failed to create issue' });
  }
};

// @desc    Get issues reported by current citizen
// @route   GET /api/issues/my
// @access  Private (Citizen)
const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error('Get my issues error:', error);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
};

// @desc    Get issues by block (Block Officer)
// @route   GET /api/issues/block
// @access  Private (Officer)
const getIssuesByBlock = async (req, res) => {
  try {
    const officerProfile = await BlockOfficer.findOne({ userId: req.user._id });

    let block;
    if (officerProfile) {
      block = officerProfile.assignedBlock;
    } else {
      block = req.user.block;
    }

    if (!block) {
      return res.status(400).json({ message: 'No block assigned to this officer' });
    }

    const issues = await Issue.find({ block })
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get block issues error:', error);
    res.status(500).json({ message: 'Failed to fetch block issues' });
  }
};

// @desc    Update issue status (Block Officer or Admin)
// @route   PUT /api/issues/:id/status
// @access  Private (Officer | Admin)
const updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Reported', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const oldStatus = issue.status;
    issue.status = status;
    await issue.save();

    // Notify the citizen of the status change
    if (oldStatus !== status && issue.reportedBy) {
      const statusMessages = {
        'In Progress': `Your issue "${issue.title}" is now being worked on (In Progress).`,
        'Resolved':    `Great news! Your issue "${issue.title}" has been marked as Resolved. ✅`,
        'Reported':    `Your issue "${issue.title}" status has been reset to Reported.`,
      };
      await createNotification(
        issue.reportedBy,
        statusMessages[status] || `Your issue "${issue.title}" status changed to ${status}.`,
        'status_update',
        issue._id,
        issue.title
      );
    }

    res.json(issue);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update issue status' });
  }
};

// @desc    Toggle duplicate flag (Block Officer or Admin)
// @route   PUT /api/issues/:id/duplicate
// @access  Private (Officer | Admin)
const toggleDuplicate = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.isDuplicate = !issue.isDuplicate;
    await issue.save();

    // Notify the citizen
    if (issue.reportedBy) {
      const msg = issue.isDuplicate
        ? `Your issue "${issue.title}" has been flagged as a duplicate.`
        : `Your issue "${issue.title}" duplicate flag has been removed.`;
      await createNotification(issue.reportedBy, msg, 'duplicate_flag', issue._id, issue.title);
    }

    res.json(issue);
  } catch (error) {
    console.error('Toggle duplicate error:', error);
    res.status(500).json({ message: 'Failed to toggle duplicate' });
  }
};

// @desc    Get all issues (Admin)
// @route   GET /api/issues/all
// @access  Private (Admin)
const getAllIssues = async (req, res) => {
  try {
    const { block, category, status, priority } = req.query;

    const filter = {};
    if (block    && block    !== 'all') filter.block    = block;
    if (category && category !== 'all') filter.category = category;
    if (status   && status   !== 'all') filter.status   = status;
    if (priority && priority !== 'all') filter.priority = priority;

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get all issues error:', error);
    res.status(500).json({ message: 'Failed to fetch all issues' });
  }
};

// @desc    Delete an issue (Admin)
// @route   DELETE /api/issues/:id
// @access  Private (Admin)
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    await Issue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ message: 'Failed to delete issue' });
  }
};

module.exports = {
  createIssue,
  getMyIssues,
  getIssuesByBlock,
  updateIssueStatus,
  toggleDuplicate,
  getAllIssues,
  deleteIssue
};
