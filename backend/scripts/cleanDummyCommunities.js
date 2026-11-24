import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.resolve('backend/.env') });

const uri = process.env.MONGO_URI;

async function run() {
  if (!uri) {
    console.error('No MONGO_URI found in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const Conversation = mongoose.model('Conversation', new mongoose.Schema({}, { strict: false }));

  // Find all public or group conversations
  const groups = await Conversation.find({
    $or: [
      { isPublic: true },
      { groupType: 'community' },
      { type: 'group' }
    ]
  }).lean();

  console.log(`Found ${groups.length} group/community conversations in total:`);
  for (const g of groups) {
    console.log(`- ID: ${g._id}, Name: "${g.name}", type: ${g.type}, groupType: ${g.groupType}, isPublic: ${g.isPublic}, inviteCode: ${g.inviteCode}, admins: ${g.admins?.length || 0}`);
  }

  const dummyInviteCodes = [
    'devsup-general',
    'devsup-algorithms',
    'devsup-sysdesign',
    'devsup-frontend'
  ];

  const dummyNames = [
    'General Engineering',
    'Algorithms & LeetCode',
    'System Design Hub',
    'Frontend Wizards'
  ];

  const res = await Conversation.deleteMany({
    $or: [
      { inviteCode: { $in: dummyInviteCodes } },
      { name: { $in: dummyNames }, inviteCode: { $regex: /^devsup-/i } },
      { name: { $in: dummyNames }, $or: [{ admins: { $size: 0 } }, { admins: { $exists: false } }] }
    ]
  });

  console.log(`Deleted ${res.deletedCount} dummy communities.`);

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
