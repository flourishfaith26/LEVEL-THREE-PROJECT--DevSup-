import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const User = (await import('./src/models/User.js')).default;
    const Conversation = (await import('./src/models/Conversation.js')).default;
    const Message = (await import('./src/models/Message.js')).default;

    const users = await User.find();
    console.log(`Users: ${users.length}`);
    for (let u of users) console.log(`  User: ${u.email} (Auth0: ${u.auth0Id})`);

    const conversations = await Conversation.find();
    console.log(`Conversations: ${conversations.length}`);

    const messages = await Message.find();
    console.log(`Messages: ${messages.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
