const Issue = require('../models/Issue');
const User = require('../models/User');
const BlockOfficer = require('../models/BlockOfficer');
const bcrypt = require('bcryptjs');

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();

    // Count by status
    const reported   = await Issue.countDocuments({ status: 'Reported' });
    const inProgress = await Issue.countDocuments({ status: 'In Progress' });
    const resolved   = await Issue.countDocuments({ status: 'Resolved' });

    // Group by block
    const byBlock = await Issue.aggregate([
      { $group: { _id: '$block', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Group by category
    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Group by priority
    const byPriority = await Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Total users
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalOfficers = await User.countDocuments({ role: 'blockofficer' });

    res.json({
      totalIssues,
      statusCounts: { reported, inProgress, resolved },
      byBlock,
      byCategory,
      byPriority,
      monthlyTrend,
      totalCitizens,
      totalOfficers
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// @desc    Get all block officers (with self-healing for orphaned records)
// @route   GET /api/admin/officers
// @access  Private (Admin)
//
// SELF-HEAL: Officers who signed up via the public form only have a User record
// (role: 'blockofficer') but NO BlockOfficer profile. This function detects those
// orphaned Users and auto-creates the missing BlockOfficer profile so they appear
// in the admin panel.
const getAllOfficers = async (req, res) => {
  try {
    // Step 1: Find all Users with role 'blockofficer'
    const officerUsers = await User.find({ role: 'blockofficer' }).select('_id name email phone block');

    // Step 2: Find which of those Users already have a BlockOfficer profile
    const existingProfiles = await BlockOfficer.find({
      userId: { $in: officerUsers.map(u => u._id) }
    }).select('userId');

    const profiledUserIds = new Set(existingProfiles.map(p => p.userId.toString()));

    // Step 3: Auto-create BlockOfficer profiles for orphaned officer Users
    const orphans = officerUsers.filter(u => !profiledUserIds.has(u._id.toString()));

    for (const user of orphans) {
      const initials = (user.name || 'OF').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      await BlockOfficer.create({
        name:          user.name,
        email:         user.email,
        phone:         user.phone || '',
        assignedBlock: user.block || 'Unassigned',
        userId:        user._id,
        avatar:        initials,
      });
      console.log(`🔧 Auto-created BlockOfficer profile for orphaned user: ${user.email}`);
    }

    // Step 4: Fetch all officers with populated user data
    const officers = await BlockOfficer.find()
      .populate('userId', 'name email phone role createdAt')
      .sort({ assignedBlock: 1 });

    res.json(officers);
  } catch (error) {
    console.error('Get officers error:', error);
    res.status(500).json({ message: 'Failed to fetch officers' });
  }
};


// @desc    Create a new block officer (Admin)
// @route   POST /api/admin/officers
// @access  Private (Admin)
const createOfficer = async (req, res) => {
  try {
    const { name, email, password, phone, assignedBlock } = req.body;

    if (!name || !email || !password || !assignedBlock) {
      return res.status(400).json({ message: 'Name, email, password, and assignedBlock are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User account with role: blockofficer
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: 'blockofficer',
      block: assignedBlock
    });

    // Create BlockOfficer profile
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const officer = await BlockOfficer.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      assignedBlock,
      userId: user._id,
      avatar: initials
    });

    res.status(201).json({
      officer,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    });
  } catch (error) {
    console.error('Create officer error:', error);
    res.status(500).json({ message: 'Failed to create officer' });
  }
};

// @desc    Update a block officer (Admin)
// @route   PUT /api/admin/officers/:id
// @access  Private (Admin)
const updateOfficer = async (req, res) => {
  try {
    const { name, phone, assignedBlock } = req.body;

    const officer = await BlockOfficer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' });
    }

    if (name)          officer.name          = name;
    if (phone)         officer.phone         = phone;
    if (assignedBlock) officer.assignedBlock = assignedBlock;

    await officer.save();

    // Also update the linked User record
    if (officer.userId) {
      const userUpdate = {};
      if (name)          userUpdate.name  = name;
      if (phone)         userUpdate.phone = phone;
      if (assignedBlock) userUpdate.block = assignedBlock;
      await User.findByIdAndUpdate(officer.userId, userUpdate);
    }

    res.json({ message: 'Officer updated successfully', officer });
  } catch (error) {
    console.error('Update officer error:', error);
    res.status(500).json({ message: 'Failed to update officer' });
  }
};

// @desc    Delete a block officer (Admin)
// @route   DELETE /api/admin/officers/:id
// @access  Private (Admin)
const deleteOfficer = async (req, res) => {
  try {
    const officer = await BlockOfficer.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' });
    }

    // Delete the linked User account too
    if (officer.userId) {
      await User.findByIdAndDelete(officer.userId);
    }

    await BlockOfficer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Officer deleted successfully' });
  } catch (error) {
    console.error('Delete officer error:', error);
    res.status(500).json({ message: 'Failed to delete officer' });
  }
};

// @desc    Get all citizens (Admin)
// @route   GET /api/admin/citizens
// @access  Private (Admin)
const getAllCitizens = async (req, res) => {
  try {
    const citizens = await User.find({ role: 'citizen' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(citizens);
  } catch (error) {
    console.error('Get citizens error:', error);
    res.status(500).json({ message: 'Failed to fetch citizens' });
  }
};

// @desc    Delete a citizen account (Admin)
// @route   DELETE /api/admin/citizens/:id
// @access  Private (Admin)
const deleteCitizen = async (req, res) => {
  try {
    const citizen = await User.findById(req.params.id);
    if (!citizen || citizen.role !== 'citizen') {
      return res.status(404).json({ message: 'Citizen not found' });
    }

    // Remove their issues
    await Issue.deleteMany({ reportedBy: citizen._id });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Citizen and associated issues deleted successfully' });
  } catch (error) {
    console.error('Delete citizen error:', error);
    res.status(500).json({ message: 'Failed to delete citizen' });
  }
};

// @desc    Delete ALL citizens + their issues (Admin)
// @route   DELETE /api/admin/citizens
// @access  Private (Admin)
const deleteAllCitizens = async (req, res) => {
  try {
    // Get all citizen user IDs
    const citizens = await User.find({ role: 'citizen' }).select('_id');
    const citizenIds = citizens.map(c => c._id);

    // Delete all issues reported by any citizen
    const issueResult = await Issue.deleteMany({ reportedBy: { $in: citizenIds } });

    // Delete all citizen user accounts
    const userResult = await User.deleteMany({ role: 'citizen' });

    res.json({
      message: 'All citizens and their issues deleted successfully',
      citizensDeleted: userResult.deletedCount,
      issuesDeleted: issueResult.deletedCount
    });
  } catch (error) {
    console.error('Delete all citizens error:', error);
    res.status(500).json({ message: 'Failed to delete all citizens' });
  }
};

// @desc    Create a new admin account (existing admin only)
// @route   POST /api/admin/create-admin
// @access  Private (Admin)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin account created successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Failed to create admin account.' });
  }
};

// @desc    Seed the very first admin (only works when NO admin exists in DB)
// @route   POST /api/admin/seed-admin
// @access  Public — but auto-locks after first use
const seedAdmin = async (req, res) => {
  try {
    // Guard: refuse if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({
        message: 'An administrator account already exists. Seeding is disabled.'
      });
    }

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: 'admin'
    });

    console.log(`🛡️  First admin seeded: ${user.email}`);

    res.status(201).json({
      message: 'First administrator account created successfully. This endpoint is now locked.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({ message: 'Failed to seed admin.' });
  }
};

module.exports = {
  getAnalytics,
  getAllOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  getAllCitizens,
  deleteCitizen,
  deleteAllCitizens,
  createAdmin,
  seedAdmin
};
