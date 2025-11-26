/*
 * E2E test for scheduled trip activation via admin endpoint.
 * Run with SERVER running and MONGO env configured.
 * Usage: node server/scripts/e2e-scheduled-activate.js
 */

import axios from 'axios';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Admin from '../src/models/Admin.js';
import Customer from '../src/models/Customer.js';
import Trip from '../src/models/Trip.js';

const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
const MONGO = process.env.MONGO_URI || process.env.MONGO || 'mongodb://127.0.0.1:27017/yalla_dev';

async function run() {
  await mongoose.connect(MONGO);
  console.log('connected to mongo');

  const password = 'E2Epassword1!';
  const hash = await bcrypt.hash(password, 8);

  // create or find admin
  const adminEmail = `e2e+admin+${Date.now()}@example.com`;
  const admin = await Admin.create({ name: 'E2E Admin', email: adminEmail, passwordHash: hash, role: 'dispatcher' });

  // login to get token
  const loginRes = await axios.post(`${SERVER}/admin/auth/login`, { email: adminEmail, password });
  const token = loginRes.data?.token;
  if (!token) throw new Error('Admin login failed');

  // create customer + scheduled trip
  const c = await Customer.create({ name: 'E2E Scheduled Customer', phone: `+200910${Date.now().toString().slice(-6)}`, passwordHash: 'x' });
  const scheduledAt = new Date(Date.now() - 2000); // in the past (due now)
  const trip = await Trip.create({ customerId: c._id, pickup: { lat: 31.2, lng: 29.9, address: 'Start' }, dropoff: { lat: 31.21, lng: 29.91, address: 'End' }, status: 'scheduled', scheduledAt });

  console.log('trip scheduled', trip._id);

  // call activate admin endpoint
  const activateUrl = `${SERVER}/admin/trips/${trip._id}/activate`;
  const res = await axios.post(activateUrl, {}, { headers: { Authorization: `Bearer ${token}` } });
  console.log('activate response', res.data);

  const final = await Trip.findById(trip._id);
  console.log('final trip status:', final.status, 'scheduledAt:', final.scheduledAt);

  // cleanup
  await Admin.deleteOne({ _id: admin._id });
  await Customer.deleteOne({ _id: c._id });
  await Trip.deleteOne({ _id: trip._id });

  await mongoose.disconnect();
  console.log('done');
}

run().catch(err => { console.error(err); process.exit(1); });
