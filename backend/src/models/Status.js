import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    required: true
  },
  caption: {
    type: String, // Used for media statuses
    default: ''
  },
  backgroundColor: {
    type: String, // Used for 'text' statuses
    default: '#1E2B3C'
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL Index: 86400 seconds = 24 hours
  }
});

const Status = mongoose.model('Status', statusSchema);
export default Status;
