/**
 * CineLink Admin Seed
 *
 * Seeds admin users into MongoDB. Add more entries to the ADMINS array as needed.
 *
 * Usage:
 *   npm run admin:seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinelink';

const ADMINS = [
  { email: 'anilkumardevarakonda03@gmail.com', name: 'Anil Kumar' },
  { email: 'bora1132004@gmail.com', name: 'Ganesh Bora' },
];

const ADMIN_PASSWORD = 'CineLink@2024';

async function seed() {
  console.log('🌱 CineLink Admin Seed');
  console.log('   MongoDB:', MONGODB_URI);
  console.log('');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  for (const admin of ADMINS) {
    const existing = await User.findOne({ email: admin.email });

    if (existing) {
      console.log(`👤 ${admin.email} — already exists`);
      if (!existing.isAdmin) {
        existing.isAdmin = true;
        existing.isApprovedDirector = true;
        existing.verifiedReal = true;
        existing.verificationStatus = 'approved';
        existing.role = 'Admin';
        await existing.save();
        console.log('   ✅ Admin privileges granted');
      } else {
        console.log('   ✅ Already admin');
      }
    } else {
      await User.create({
        email: admin.email,
        password: hashed,
        fullName: admin.name,
        displayName: admin.name,
        name: admin.name,
        role: 'Admin',
        isAdmin: true,
        isApprovedDirector: true,
        verifiedReal: true,
        verificationStatus: 'approved',
        premiumTier: 'black',
        isOnline: false,
        lastSeen: new Date(),
      });
      console.log(`✅ ${admin.email} — created (password: ${ADMIN_PASSWORD})`);
    }
  }

  await mongoose.disconnect();
  console.log('\n🎉 Done.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
