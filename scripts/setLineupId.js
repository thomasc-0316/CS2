const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // download from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('lineups').get();
  console.log(`Found ${snapshot.size} lineups…`);
  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const docId = doc.id;
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
  if (count % 400 !== 0) {
    await batch.commit();
  }
  console.log(`Done. Updated ${count} lineups.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
