import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String, // Only required for group chats
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  allowAnyMemberToAdd: {
    type: Boolean,
    default: false
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  messageSequence: {
    type: Number,
    default: 0
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  webhooks: [{
    token: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'DevOps Webhook'
    },
    service: {
      type: String,
      enum: ['github', 'vercel', 'sentry', 'custom'],
      default: 'custom'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastTriggeredAt: {
      type: Date
    }
  }]
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);