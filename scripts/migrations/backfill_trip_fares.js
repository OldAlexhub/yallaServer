#!/usr/bin/env node
import { connectDB } from '../../src/bootstrap/connectDB.js';
import Customer from '../../src/models/Customer.js';
import CustomerDiscounts from '../../src/models/CustomerDiscounts.js';
import FareStructure from '../../src/models/FareStructure.js';
import Trip from '../../src/models/Trip.js';
import './src/bootstrap/loadEnv.js';

const BATCH_SIZE = 200;

const usage = () => {
  console.log('Usage: node backfill_trip_fares.js [--dry-run] [--limit N]');
  console.log('  --dry-run    : do not persist updates, only log what would be changed');
  console.log('  --limit N    : stop after N updated trips (for testing)');
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: (() => {
      const idx = args.indexOf('--limit');
      if (idx >= 0 && args[idx + 1]) return parseInt(args[idx + 1], 10) || null;
      return null;
    })(),
  };
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const run = async () => {
  try {
    const { dryRun, limit } = parseArgs();
    await connectDB();
    console.log('Connected to DB — running backfill_trip_fares migration');

    const discountsDoc = await CustomerDiscounts.findOne();
    if (!discountsDoc) console.warn('No CustomerDiscounts found — using defaults (founder 20%, regular 0%)');

    const cursor = Trip.find({ status: 'completed' })
      .or([{ fare: { $exists: false } }, { fare: null }, { discountPercent: { $exists: false } }])
      .cursor({ batchSize: BATCH_SIZE });

    let updated = 0;
    for await (const trip of cursor) {
      if (limit && updated >= limit) break;

      try {
        // compute base fare
        let baseFare = trip.fareEstimate;
        if (baseFare === undefined || baseFare === null) {
          // try recompute using FareStructure
          const fareDoc = await FareStructure.findOne();
          const defaultFare = { baseFare: 10, perKm: 4.5 };
          const fs = fareDoc ? { ...defaultFare, ...fareDoc.toObject() } : defaultFare;
          baseFare = round2(fs.baseFare + (fs.perKm || 0) * (trip.distanceKm || 0));
        }

        // determine customer tier & applicable percent
        let discountPercent = 0;
        const customer = await Customer.findById(trip.customerId);
        if (customer && discountsDoc) {
          const tier = customer.loyalty?.tier || (customer.founder ? 'founder' : 'regular');
          if (tier === 'founder') discountPercent = discountsDoc.founderDiscountPercentage || 0;
          else discountPercent = discountsDoc.regularDiscountPercentage || 0;
        }

        const discountAmount = round2(baseFare * (discountPercent / 100));
        const finalFare = round2(Math.max(0, baseFare - discountAmount));

        // If already set and matches, skip
        const alreadyFare = typeof trip.fare === 'number' && trip.fare !== null;
        const needsUpdate = !alreadyFare || trip.discountPercent === undefined || trip.discountPercent === null;

        if (!needsUpdate) {
          continue;
        }

        console.log(`Trip ${trip._id}: baseFare=${baseFare} discountPercent=${discountPercent} discountAmount=${discountAmount} finalFare=${finalFare}`);

        if (!dryRun) {
          trip.fare = finalFare;
          trip.discountPercent = discountPercent;
          trip.discountAmount = discountAmount;
          await trip.save();
        }

        updated += 1;
      } catch (err) {
        console.error('Error processing trip', trip._id, err);
      }
    }

    console.log(`Done. Updated ${updated} trip(s). (dryRun=${!!parseArgs().dryRun})`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
};

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  usage();
  process.exit(0);
}

run();
