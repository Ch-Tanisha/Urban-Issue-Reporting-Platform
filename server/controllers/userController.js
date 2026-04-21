const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, pincode, block, age, gender } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name)    user.name    = name.trim();
    if (phone)   user.phone   = phone.trim();
    if (address) user.address = address.trim();
    if (city)    user.city    = city.trim();
    if (pincode) user.pincode = pincode.trim();
    if (block)   user.block   = block;
    if (age)     user.age     = Number(age);
    if (gender)  user.gender  = gender;

    const updated = await user.save();

    res.json({
      id:      updated._id,
      name:    updated.name,
      email:   updated.email,
      phone:   updated.phone,
      role:    updated.role,
      address: updated.address,
      city:    updated.city,
      pincode: updated.pincode,
      block:   updated.block,
      age:     updated.age,
      gender:  updated.gender,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// @desc    Change current user's password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = { updateProfile, changePassword };
