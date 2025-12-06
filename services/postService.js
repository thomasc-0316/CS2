// services/postService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

/**
 * Compress image before upload
 * @param {string} uri - Local image URI
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<string>} - Compressed image URI
 */
const compressImage = async (uri, quality = 0.8) => {
  try {
    // Use expo-image-manipulator for compression
    const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');
    
    const result = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: 1920, // Max width (maintains aspect ratio)
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, return original URI
    return uri;
  }
};

/**
 * Upload a single image to Firebase Storage
 * @param {string} localUri - Local image URI
 * @param {string} userId - User ID
 * @param {string} imageType - 'stand', 'aim', 'land', or 'moreDetails'
 * @returns {Promise<string>} - Download URL
 */
const uploadLineupImage = async (localUri, userId, imageType) => {
  if (!localUri) return null;
  
  // If it's already a Firebase URL, return it
  if (localUri.startsWith('http')) {
    return localUri;
  }

  try {
    // Compress image first
    const compressedUri = await compressImage(localUri, 0.8);
    
    // Convert to blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const storagePath = `lineups/${userId}/${timestamp}_${imageType}.jpg`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Clean up blob
    if (blob.close) {
      blob.close();
    }
    
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading ${imageType} image:`, error);
    throw new Error(`Failed to upload ${imageType} image`);
  }
};

/**
 * Create a new lineup post
 * @param {Object} postData - Post data from form
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<string>} - New lineup ID
 */
export const createLineupPost = async (postData, currentUser) => {
  if (!currentUser) {
    throw new Error('User must be authenticated to post');
  }

  try {
    // Upload all images
    const [standImageURL, aimImageURL, landImageURL, moreDetailsImageURL] = await Promise.all([
      uploadLineupImage(postData.standImage, currentUser.uid, 'stand'),
      uploadLineupImage(postData.aimImage, currentUser.uid, 'aim'),
      uploadLineupImage(postData.landImage, currentUser.uid, 'land'),
      postData.moreDetailsImage
        ? uploadLineupImage(postData.moreDetailsImage, currentUser.uid, 'moreDetails')
        : Promise.resolve(null)
    ]);

    // Get user profile info
    const userProfile = currentUser.profile || {};
    
    // Create lineup document
    const lineupData = {
      // Content
      title: postData.title,
      description: postData.description || '',
      throwInstructions: postData.throwInstructions || '',
      
      // Classification
      mapId: postData.mapId || 'dust2', // Default to dust2 for now
      side: postData.side,
      site: postData.site,
      nadeType: postData.nadeType,
      
      // Images (Firebase Storage URLs)
      standImage: standImageURL,
      aimImage: aimImageURL,
      landImage: landImageURL,
      moreDetailsImage: moreDetailsImageURL,
      
      // Creator info
      creatorId: currentUser.uid,
      creatorUsername: userProfile.username || currentUser.email?.split('@')[0] || 'User',
      creatorAvatar: userProfile.profilePicture || null,
      creatorVerified: userProfile.isVerified || false,
      creatorPlayerId: userProfile.playerID || null,
      
      // Status
      isPublic: true,
      isDraft: false,
      isTextbook: false,
      
      // Stats
      upvotes: 0,
      views: 0,
      favorites: 0,
      
      // Timestamps
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'lineups'), lineupData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating lineup post:', error);
    throw error;
  }
};

/**
 * Update an existing lineup post
 * @param {string} lineupId - Lineup document ID
 * @param {Object} postData - Updated post data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<void>}
 */
export const updateLineupPost = async (lineupId, postData, currentUser) => {
  if (!currentUser) {
    throw new Error('User must be authenticated to edit');
  }

  try {
    // Verify ownership
    const lineupRef = doc(db, 'lineups', lineupId);
    const lineupSnap = await getDoc(lineupRef);
    
    if (!lineupSnap.exists()) {
      throw new Error('Lineup not found');
    }
    
    const existingData = lineupSnap.data();
    if (existingData.creatorId !== currentUser.uid) {
      throw new Error('You can only edit your own posts');
    }

    // Upload new images if they changed
    const standImageURL = postData.standImage !== existingData.standImage
      ? await uploadLineupImage(postData.standImage, currentUser.uid, 'stand')
      : existingData.standImage;
      
    const aimImageURL = postData.aimImage !== existingData.aimImage
      ? await uploadLineupImage(postData.aimImage, currentUser.uid, 'aim')
      : existingData.aimImage;
      
    const landImageURL = postData.landImage !== existingData.landImage
      ? await uploadLineupImage(postData.landImage, currentUser.uid, 'land')
      : existingData.landImage;

    const moreDetailsImageURL = postData.moreDetailsImage && postData.moreDetailsImage !== existingData.moreDetailsImage
      ? await uploadLineupImage(postData.moreDetailsImage, currentUser.uid, 'moreDetails')
      : (postData.moreDetailsImage || null);

    // Update lineup document
    const updates = {
      title: postData.title,
      description: postData.description || '',
      throwInstructions: postData.throwInstructions || '',
      side: postData.side,
      site: postData.site,
      nadeType: postData.nadeType,
      standImage: standImageURL,
      aimImage: aimImageURL,
      landImage: landImageURL,
      moreDetailsImage: moreDetailsImageURL,
      updatedAt: serverTimestamp()
    };

    await updateDoc(lineupRef, updates);
  } catch (error) {
    console.error('Error updating lineup post:', error);
    throw error;
  }
};

/**
 * Delete a lineup post
 * @param {string} lineupId - Lineup document ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<void>}
 */
export const deleteLineupPost = async (lineupId, currentUser) => {
  if (!currentUser) {
    throw new Error('User must be authenticated to delete');
  }

  try {
    // Verify ownership
    const lineupRef = doc(db, 'lineups', lineupId);
    const lineupSnap = await getDoc(lineupRef);
    
    if (!lineupSnap.exists()) {
      throw new Error('Lineup not found');
    }
    
    const lineupData = lineupSnap.data();
    if (lineupData.creatorId !== currentUser.uid) {
      throw new Error('You can only delete your own posts');
    }

    // Delete images from Storage (optional - can keep for now)
    // We'll implement this later to avoid orphaned files
    
    // Delete Firestore document
    await deleteDoc(lineupRef);
  } catch (error) {
    console.error('Error deleting lineup post:', error);
    throw error;
  }
};

/**
 * Get a lineup by ID
 * @param {string} lineupId - Lineup document ID
 * @returns {Promise<Object>} - Lineup data
 */
export const getLineupById = async (lineupId) => {
  try {
    const lineupRef = doc(db, 'lineups', lineupId);
    const lineupSnap = await getDoc(lineupRef);
    
    if (!lineupSnap.exists()) {
      throw new Error('Lineup not found');
    }
    
    return {
      id: lineupSnap.id,
      ...lineupSnap.data()
    };
  } catch (error) {
    console.error('Error fetching lineup:', error);
    throw error;
  }
};