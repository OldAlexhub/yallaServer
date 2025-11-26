import 'dotenv/config';
import mongoose from 'mongoose';

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Testing MONGO_URI:', uri ? uri.split('@')[0] + '@...' : 'MONGO_URI not set');
    await mongoose.connect(uri, { connectTimeoutMS: 10000 });
    console.log('✓ Mongo connected');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Mongo test error', err);
    process.exit(1);
  }
})();
