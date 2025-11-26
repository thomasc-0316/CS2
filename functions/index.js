const {onDocumentCreated, onDocumentDeleted} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue, Timestamp} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// Increment follower count when someone follows a user
exports.onFollowerAdded = onDocumentCreated(
    "users/{userId}/followers/{followerId}",
    async (event) => {
      const userId = event.params.userId;
      const followerId = event.params.followerId;

      try {
        // Increment target user's follower count
        await db.collection("users").doc(userId).set({
          followers: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // Increment following user's following count
        await db.collection("users").doc(followerId).set({
          following: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        console.log(`Follower added: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error incrementing follower counts:", error);
      }
    }
);

// Daily cleanup of old rooms at 07:00 UTC
exports.cleanupRooms = onSchedule("0 7 * * *", async () => {
  const db = getFirestore();
  // Remove rooms older than 24 hours
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  try {
    const snapshot = await db.collection("rooms")
        .where("createdAt", "<", cutoff)
        .get();

    if (snapshot.empty) {
      console.log("No rooms to clean up");
      return;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} old rooms`);
  } catch (error) {
    console.error("Failed to clean up rooms:", error);
  }
});

// Decrement follower count when someone unfollows a user
exports.onFollowerRemoved = onDocumentDeleted(
    "users/{userId}/followers/{followerId}",
    async (event) => {
      const userId = event.params.userId;
      const followerId = event.params.followerId;

      try {
        // Decrement target user's follower count
        await db.collection("users").doc(userId).set({
          followers: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        // Decrement following user's following count
        await db.collection("users").doc(followerId).set({
          following: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        }, {merge: true});

        console.log(`Follower removed: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error decrementing follower counts:", error);
      }
    }
);
