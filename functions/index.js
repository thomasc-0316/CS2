const {onDocumentCreated, onDocumentDeleted} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue, Timestamp} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// Increment follower count when someone follows a user.
// Wrapped in a transaction so the followers/following counters never drift
// from the source-of-truth subcollection — even on retry. (H2)
exports.onFollowerAdded = onDocumentCreated(
    "users/{userId}/followers/{followerId}",
    async (event) => {
      const userId = event.params.userId;
      const followerId = event.params.followerId;

      try {
        await db.runTransaction(async (tx) => {
          const targetRef = db.collection("users").doc(userId);
          const followerRef = db.collection("users").doc(followerId);
          const [targetSnap, followerSnap] = await Promise.all([
            tx.get(targetRef),
            tx.get(followerRef),
          ]);
          if (targetSnap.exists) {
            tx.update(targetRef, {
              followers: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          if (followerSnap.exists) {
            tx.update(followerRef, {
              following: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });
        console.log(`Follower added: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error incrementing follower counts:", error);
      }
    },
);

// Daily cleanup of old rooms at 07:00 UTC.
// (H3) Pages results in batches of <=450 so a single run can clean an
// arbitrary number of stale rooms without exceeding the 500-write batch cap.
const ROOM_CLEANUP_BATCH_SIZE = 450;

exports.cleanupRooms = onSchedule("0 7 * * *", async () => {
  // Remove rooms older than 24 hours
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  let totalDeleted = 0;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const snapshot = await db.collection("rooms")
          .where("createdAt", "<", cutoff)
          .limit(ROOM_CLEANUP_BATCH_SIZE)
          .get();

      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += snapshot.size;

      // If we got less than a full page, we're done.
      if (snapshot.size < ROOM_CLEANUP_BATCH_SIZE) break;
    }
    console.log(`Cleaned up ${totalDeleted} old rooms`);
  } catch (error) {
    console.error("Failed to clean up rooms:", error);
  }
});

// Decrement follower count when someone unfollows a user.
// Transactional + clamped at zero so retries cannot push the counter
// negative or revive a deleted user document. (H2)
exports.onFollowerRemoved = onDocumentDeleted(
    "users/{userId}/followers/{followerId}",
    async (event) => {
      const userId = event.params.userId;
      const followerId = event.params.followerId;

      try {
        await db.runTransaction(async (tx) => {
          const targetRef = db.collection("users").doc(userId);
          const followerRef = db.collection("users").doc(followerId);
          const [targetSnap, followerSnap] = await Promise.all([
            tx.get(targetRef),
            tx.get(followerRef),
          ]);
          if (targetSnap.exists) {
            const current = targetSnap.get("followers") || 0;
            if (current > 0) {
              tx.update(targetRef, {
                followers: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
          if (followerSnap.exists) {
            const current = followerSnap.get("following") || 0;
            if (current > 0) {
              tx.update(followerRef, {
                following: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        });
        console.log(`Follower removed: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error decrementing follower counts:", error);
      }
    },
);
