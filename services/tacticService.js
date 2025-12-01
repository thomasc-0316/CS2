import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const tacticsCollection = collection(db, 'tactics');

const docToTactic = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    title: data.title || 'Untitled tactic',
    description: data.description || '',
    mapId: data.mapId,
    side: (data.side || 'T').toUpperCase(),
    lineupIds: Array.isArray(data.lineupIds) ? data.lineupIds : [],
    tags: data.tags || [],
    isTextbook: !!data.isTextbook,
    isPublic: data.isPublic !== false,
    creatorId: data.creatorId || null,
    creatorUsername: data.creatorUsername || '',
    creatorPlayerId: data.creatorPlayerId || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export const fetchPublicTactics = async (mapId, side) => {
  if (!mapId || !side) return [];
  try {
    const q = query(
      tacticsCollection,
      where('mapId', '==', mapId),
      where('side', '==', side.toUpperCase()),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTactic);
  } catch (error) {
    console.error('Failed to fetch public tactics', error);
    return [];
  }
};

export const fetchUserTactics = async (creatorId, mapId, side) => {
  if (!creatorId) return [];
  try {
    const filters = [where('creatorId', '==', creatorId)];
    if (mapId) filters.push(where('mapId', '==', mapId));
    if (side) filters.push(where('side', '==', side.toUpperCase()));

    const q = query(
      tacticsCollection,
      ...filters,
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToTactic);
  } catch (error) {
    console.error('Failed to fetch user tactics', error);
    return [];
  }
};

export const createTactic = async ({
  title,
  description,
  mapId,
  side,
  lineupIds = [],
  tags = [],
  isTextbook = false,
  isPublic = true,
  creatorId = null,
  creatorUsername = '',
  creatorPlayerId = null,
}) => {
  if (!mapId || !side) {
    throw new Error('mapId and side are required to create a tactic');
  }

  const payload = {
    title: title || 'Untitled tactic',
    description: description || '',
    mapId,
    side: side.toUpperCase(),
    lineupIds: Array.isArray(lineupIds) ? lineupIds.map((id) => id.toString()) : [],
    tags,
    isTextbook,
    isPublic,
    creatorId,
    creatorUsername,
    creatorPlayerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(tacticsCollection, payload);
  return { id: docRef.id, ...payload };
};
