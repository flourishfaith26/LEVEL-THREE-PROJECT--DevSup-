import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['video', 'audio'], required: true },
    status: { type: String, enum: ['completed', 'missed', 'rejected'], required: true },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('CallLog', callLogSchema);
