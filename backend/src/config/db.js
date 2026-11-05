import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS resolving querySrv ECONNREFUSED for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Asynchronously run startup data migrations for past, present, and future compatibility
    runStartupMigrations().catch(err => {
      console.error('Non-fatal error running startup migrations:', err);
    });
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const runStartupMigrations = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    const Message = (await import('../models/Message.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;

    // 1. Clean up past/present user avatars in MongoDB:
    // Any user without an avatar or with old ui-avatars/placeholder URL gets updated to /default-avatar.svg
    const avatarResult = await User.updateMany(
      {
        $or: [
          { avatarUrl: { $in: [null, '', undefined] } },
          { avatarUrl: { $regex: 'ui-avatars\\.com|placeholder\\.com|via\\.placeholder' } }
        ]
      },
      { $set: { avatarUrl: '/default-avatar.svg' } }
    );
    if (avatarResult.modifiedCount > 0) {
      console.log(`Migrated ${avatarResult.modifiedCount} user avatars to /default-avatar.svg`);
    }

    // 2. Direct conversation read/delivery repair:
    // If a direct conversation has messages where the other participant has replied or been active,
    // ensure all prior messages are marked as read & delivered
    const directConvs = await Conversation.find({ type: 'direct' }).select('_id participants');
    for (const conv of directConvs) {
      if (conv.participants && conv.participants.length === 2) {
        const p1 = conv.participants[0];
        const p2 = conv.participants[1];

        // Ensure deliveredTo is set for all direct messages
        await Message.updateMany(
          { conversationId: conv._id, sender: p1, deliveredTo: { $ne: p2 } },
          { $addToSet: { deliveredTo: p2 } }
        );
        await Message.updateMany(
          { conversationId: conv._id, sender: p2, deliveredTo: { $ne: p1 } },
          { $addToSet: { deliveredTo: p1 } }
        );

        // If p2 has sent any message after or around p1's message, mark p1's messages as read by p2
        const p2LastMsg = await Message.findOne({ conversationId: conv._id, sender: p2 }).sort({ createdAt: -1 });
        if (p2LastMsg) {
          await Message.updateMany(
            { conversationId: conv._id, sender: p1, createdAt: { $lte: p2LastMsg.createdAt } },
            { $addToSet: { readBy: p2, deliveredTo: p2 } }
          );
        }

        const p1LastMsg = await Message.findOne({ conversationId: conv._id, sender: p1 }).sort({ createdAt: -1 });
        if (p1LastMsg) {
          await Message.updateMany(
            { conversationId: conv._id, sender: p2, createdAt: { $lte: p1LastMsg.createdAt } },
            { $addToSet: { readBy: p1, deliveredTo: p1 } }
          );
        }
      }
    }
  } catch (err) {
    console.error('Error during startup migrations:', err);
  }
};
