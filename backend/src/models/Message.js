import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  attachmentName: {
    type: String,
    default: ''
  },
  attachmentType: {
    type: String,
    default: ''
  },
  isCodeSnippet: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'plaintext' // e.g., 'javascript', 'python', 'html'
  },
  devopsAlert: {
    service: {
      type: String,
      enum: ['github', 'vercel', 'sentry', 'custom', 'ci'],
      default: 'custom'
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending', 'error', 'info'],
      default: 'info'
    },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    branch: { type: String, default: '' },
    commit: { type: String, default: '' },
    author: { type: String, default: '' },
    url: { type: String, default: '' },
    environment: { type: String, default: '' },
    fields: [{
      label: { type: String },
      value: { type: String }
    }]
  },
  codeReviews: [{
    lineNumber: {
      type: Number,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      default: 'Developer'
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeletedForEveryone: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  clientMessageId: {
    type: String,
    default: ''
  },
  sequence: {
    type: Number
  }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);