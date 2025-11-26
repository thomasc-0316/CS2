// services/lineupService.js
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Get all lineups for a specific map
export const getLineupsByMap = async (mapId) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('mapId', '==', mapId),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const lineups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return lineups;
  } catch (error) {
    console.error('Error fetching lineups by map:', error);
    return [];
  }
};

// Get lineups with filters (side, site, nadeType)
export const getFilteredLineups = async (mapId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'lineups'),
      where('mapId', '==', mapId),
      where('isPublic', '==', true)
    );
    
    // Add filters
    if (filters.side) {
      q = query(q, where('side', '==', filters.side));
    }
    if (filters.site) {
      q = query(q, where('site', '==', filters.site));
    }
    if (filters.nadeType) {
      q = query(q, where('nadeType', '==', filters.nadeType));
    }
    
    // Order by upload date
    q = query(q, orderBy('uploadedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const lineups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return lineups;
  } catch (error) {
    console.error('Error fetching filtered lineups:', error);
    return [];
  }
};

// Get hot/trending lineups (sorted by upvotes)
export const getHotLineups = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('isPublic', '==', true),
      orderBy('upvotes', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const lineups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return lineups;
  } catch (error) {
    console.error('Error fetching hot lineups:', error);
    return [];
  }
};

// Get lineups by creator
export const getLineupsByCreator = async (creatorId) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('creatorId', '==', creatorId),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const lineups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return lineups;
  } catch (error) {
    console.error('Error fetching lineups by creator:', error);
    return [];
  }
};

// Get single lineup by ID
export const getLineupById = async (lineupId) => {
  try {
    const docRef = doc(db, 'lineups', lineupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching lineup by ID:', error);
    return null;
  }
};

// Get recent lineups (for home feed)
export const getRecentLineups = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const lineups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return lineups;
  } catch (error) {
    console.error('Error fetching recent lineups:', error);
    return [];
  }
};