const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const admin = require('firebase-admin');
const fs = require('fs');

const DRY_RUN = process.argv.includes('--dry-run');

const serviceAccountKeyPath = path.resolve(
  __dirname,
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 'serviceAccountKey.json',
);

if (!fs.existsSync(serviceAccountKeyPath)) {
  console.error('Firebase service account key file not found.');
  console.error(`Expected at: ${serviceAccountKeyPath}`);
  process.exit(1);
}

// Refuse to start if the key path is inside the repo and not gitignored.
function ensureGitignored(absKeyPath) {
  const repoRoot = path.resolve(__dirname, '..');
  if (!absKeyPath.startsWith(repoRoot)) return;
  const gitignorePath = path.join(repoRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    console.error('❌ .gitignore not found at repo root.');
    process.exit(1);
  }
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('serviceAccountKey.json')) {
    console.error('❌ REFUSING TO RUN: serviceAccountKey.json is not in .gitignore.');
    process.exit(1);
  }
}
ensureGitignored(serviceAccountKeyPath);

// eslint-disable-next-line import/no-dynamic-require, global-require
const serviceAccount = require(serviceAccountKeyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const promptYesNo = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} (yes/no) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });

async function main() {
  const snapshot = await db.collection('lineups').get();
  console.log(`Found ${snapshot.size} lineups…`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);

  if (!DRY_RUN) {
    const ok = await promptYesNo(`About to set id field on ${snapshot.size} lineup docs. Proceed?`);
    if (!ok) {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const docId = doc.id;
    if (DRY_RUN) {
      console.log(`🟡 [dry-run] would set id=${docId}`);
      count++;
      continue;
    }
    batch.update(doc.ref, { id: docId });
    count++;

    // Commit every 400 writes to stay under batch limits (500)
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Committed ${count} updates…`);
      batch = db.batch();
    }
  }

  // Commit any remaining writes
  if (!DRY_RUN && count % 400 !== 0) {
    await batch.commit();
  }
  console.log(`Done. Updated ${count} lineups.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
