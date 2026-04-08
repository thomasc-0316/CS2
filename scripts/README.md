# Admin Scripts

These scripts use Firebase Admin privileges and bypass Firestore/Storage security rules.

## Required Setup

1. Create `scripts/.env` from `scripts/.env.example`.
2. Set:
   - `TEXTBOOK_UID` (required)
   - `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` (required path to a local service-account JSON key)
3. Keep the JSON key outside git-tracked files.

## Security Notes

- Never commit service account JSON files.
- Store keys locally and rotate them immediately if they were ever committed.
- Use least-privilege service accounts where possible.

## Scripts

- `uploadLineupsWithImages.js`
  - Uploads lineup images to Storage and writes lineup docs to Firestore.
- `migrateLineups.js`
  - Bulk inserts lineup metadata into Firestore.
- `setLineupId.js`
  - Backfills each lineup document with its own `id` field.
