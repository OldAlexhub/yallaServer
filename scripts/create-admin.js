import bcrypt from 'bcryptjs';
import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set in .env');
    console.log('Connecting to', uri.split('@')[0] + '@...');
    await mongoose.connect(uri, { connectTimeoutMS: 10000 });

    const email = 'mohamedgad@yalla.local';
    const password = '12345678';
    const name = 'mohamedgad';
    const role = 'superadmin';

    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log('Admin already exists:', email);
      await mongoose.disconnect();
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, passwordHash: hash, role });
    await admin.save();
    console.log('Created admin:', { email, name, role });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('create-admin error', err);
    process.exit(1);
  }
})();
