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
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9._]{3,30}$/, 'Username must be 3-30 characters and can only contain lowercase letters, numbers, underscores (_), and periods (.)']
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: {
    type: String,
    select: false
  },
  passwordSalt: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpiry: {
    type: Date,
    select: false
  },
  avatarUrl: { 
    type: String,
    default: '/default-avatar.svg'
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
  githubId: {
    type: String,
    default: ''
  },
  githubUsername: {
    type: String,
    default: ''
  },
  githubProfileUrl: {
    type: String,
    default: ''
  },
  githubVerified: {
    type: Boolean,
    default: false
  },
  githubStats: {
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    publicGists: { type: Number, default: 0 },
    avatarUrl: { type: String, default: '' },
    topLanguages: [{ type: String }]
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
  },
  readReceipts: {
    type: Boolean,
    default: true
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);