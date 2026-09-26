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
  isCodeSnippet: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'plaintext' // e.g., 'javascript', 'python', 'html'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);