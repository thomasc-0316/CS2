const {onDocumentCreated, onDocumentDeleted} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

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
        await db.collection("users").doc(userId).update({
          followers: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Increment following user's following count
        await db.collection("users").doc(followerId).update({
          following: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Follower added: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error incrementing follower counts:", error);
      }
    }
);

// Decrement follower count when someone unfollows a user
exports.onFollowerRemoved = onDocumentDeleted(
    "users/{userId}/followers/{followerId}",
    async (event) => {
      const userId = event.params.userId;
      const followerId = event.params.followerId;

      try {
        // Decrement target user's follower count
        await db.collection("users").doc(userId).update({
          followers: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Decrement following user's following count
        await db.collection("users").doc(followerId).update({
          following: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Follower removed: ${followerId} -> ${userId}`);
      } catch (error) {
        console.error("Error decrementing follower counts:", error);
      }
    }
);
