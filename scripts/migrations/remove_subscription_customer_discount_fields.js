#!/usr/bin/env node
import { connectDB } from '../src/bootstrap/connectDB.js';
import SubscriptionSettings from '../src/models/SubscriptionSettings.js';
import './src/bootstrap/loadEnv.js';

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB — running migration to remove customer discount fields from SubscriptionSettings');

    const update = { $unset: { founderDiscountPercentage: '', regularDiscountPercentage: '' } };
    const result = await SubscriptionSettings.updateMany({}, update);
    console.log('Migration result:', result);
    console.log('Done — removed founderDiscountPercentage and regularDiscountPercentage from SubscriptionSettings documents.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
};

run();
