/*
 * E2E test (manual run) for concurrent accept race condition.
 * Run with SERVER running and MONGO env configured (same env as server).
 * Uses JWT secret from process.env.JWT_SECRET.
 *
 * Usage:
 *   node server/scripts/e2e-accept-race.js
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import Customer from '../src/models/Customer.js';
import Driver from '../src/models/Driver.js';
import Trip from '../src/models/Trip.js';

const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
const MONGO = process.env.MONGO_URI || process.env.MONGO || 'mongodb://127.0.0.1:27017/yalla_dev';

async function run() {
  await mongoose.connect(MONGO);
  console.log('connected to mongo');

  // create two drivers
  const d1 = await Driver.create({ name: 'E2E Driver 1', phone: `+200900${Date.now().toString().slice(-6)}`, passwordHash: 'x', documents: { status: 'approved' }, subscription: { active: true, expiresAt: new Date(Date.now()+7*24*3600*1000) } });
  const d2 = await Driver.create({ name: 'E2E Driver 2', phone: `+200901${Date.now().toString().slice(-6)}`, passwordHash: 'x', documents: { status: 'approved' }, subscription: { active: true, expiresAt: new Date(Date.now()+7*24*3600*1000) } });

  // create a customer
  const c = await Customer.create({ name: 'E2E Test Customer', phone: `+200902${Date.now().toString().slice(-6)}`, passwordHash: 'x' });

  // create trip with status requested
  const trip = await Trip.create({ customerId: c._id, pickup: { lat: 31.2, lng: 29.9, address: 'Start' }, dropoff: { lat: 31.21, lng: 29.91, address: 'End' }, status: 'requested', fareEstimate: 20 });

  const token1 = jwt.sign({ driverId: d1._id }, process.env.JWT_SECRET);
  const token2 = jwt.sign({ driverId: d2._id }, process.env.JWT_SECRET);

  console.log('trip created', trip._id.toString());

  // run two concurrent accepts
  const url = `${SERVER}/driver/trip/accept`;
  const p1 = axios.post(url, { tripId: trip._id }, { headers: { Authorization: `Bearer ${token1}` } }).catch(e => e.response ? e.response.data : { error: e.message });
  const p2 = axios.post(url, { tripId: trip._id }, { headers: { Authorization: `Bearer ${token2}` } }).catch(e => e.response ? e.response.data : { error: e.message });

  const [r1, r2] = await Promise.all([p1, p2]);

  console.log('driver1 response:', r1);
  console.log('driver2 response:', r2);

  const final = await Trip.findById(trip._id);
  console.log('final trip driverId:', final.driverId);

  // cleanup
  await Driver.deleteMany({ _id: { $in: [d1._id, d2._id] } });
  await Customer.deleteOne({ _id: c._id });
  await Trip.deleteOne({ _id: trip._id });

  await mongoose.disconnect();
  console.log('done');
}

run().catch(err => { console.error(err); process.exit(1); });
