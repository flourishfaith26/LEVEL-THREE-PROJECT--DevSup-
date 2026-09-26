import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  auth0Id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  displayName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  avatarUrl: { 
    type: String 
  },
  about: {
    type: String,
    default: 'Available'
  },
  techDiscipline: { 
    type: String, 
    enum: ['Frontend', 'Backend', 'Fullstack', 'UI/UX', 'DevOps', 'Data'],
    default: 'Fullstack'
  },
  onlineStatus: { 
    type: String, 
    enum: ['online', 'offline', 'away'], 
    default: 'offline' 
  },
  socketId: { 
    type: String,
    default: null
  },
  githubProfile: {
    type: String,
    default: ''
  },
  linkedinProfile: {
    type: String,
    default: ''
  },
  portfolioUrl: {
    type: String,
    default: ''
  },
  verificationProof: {
    type: String,
    default: ''
  },
  hasCompletedProfile: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);