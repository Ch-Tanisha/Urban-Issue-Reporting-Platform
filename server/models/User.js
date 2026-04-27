const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['citizen', 'blockofficer', 'admin'],
    default: 'citizen'
  },
  age: {
    type: Number
  },
  gender: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  pincode: {
    type: String
  },
  block: {
    type: String
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
