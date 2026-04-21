const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Road & Infrastructure',
      'Garbage & Sanitation',
      'Water Supply',
      'Electricity & Lighting',
      'Public Safety',
      'Drainage',
      'Other'
    ]
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  coordinates: {
    type: String,
    default: ''
  },
  block: {
    type: String,
    required: [true, 'Block is required']
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported'
  },
  photo: {
    type: String,
    default: ''
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citizenName: {
    type: String
  },
  citizenContact: {
    type: String
  },
  citizenPhone: {
    type: String
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  reportedOn: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Issue', issueSchema);
