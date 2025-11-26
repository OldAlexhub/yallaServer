Backfill & cleanup migrations
=============================

This folder contains migrations intended to be run manually against a database (staging/production) after taking a backup.

Important:
- Always run these scripts against a staging instance first and take a DB backup before running in production.
- Use the `--dry-run` flag when available to verify the intended changes before persisting them.

Available migrations:
- remove_subscription_customer_discount_fields.js — removes legacy discount fields from SubscriptionSettings
- backfill_trip_fares.js — computes and sets `fare`, `discountPercent`, and `discountAmount` on completed Trip documents that are missing them.

Example usage:

```bash
# Run migration in dry-run mode to preview changes:
node backfill_trip_fares.js --dry-run --limit 20

# Run migration for real:
node backfill_trip_fares.js

# Using npm script from project root:
npm run migrate:backfill-trip-fares -- --dry-run --limit 20
```

Note the npm script uses node to run the script and accepts flags after a double-dash. Always ensure backups are available.
