// services/lineupService.js
//
// All read functions enforce a maximum page size so we never trigger an
// unbounded full-collection scan (the C6 finding from FULL_QA_AUDIT.md).
// Existing callers continue to receive a plain array; callers that need
// cursor-based pagination should use the *Paged variants which return
// { lineups, lastDoc, hasMore }.
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
} from './firestoreClient';
import { db } from '../firebaseConfig';

export const DEFAULT_PAGE_SIZE = 50;

const buildPage = (snapshot) => {
  const lineups = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const lastDoc = snapshot.docs.length
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;
  return { lineups, lastDoc, hasMore: snapshot.docs.length >= 1 && snapshot.docs.length === lineups.length };
};

const withCursor = (baseConstraints, { pageSize, lastDoc }) => {
  const constraints = [...baseConstraints];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));
  return constraints;
};

// ---- Backward-compatible array-returning APIs (always limited) ----

export const getLineupsByMap = async (mapId, pageSize = DEFAULT_PAGE_SIZE) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('mapId', '==', mapId),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc'),
      limit(pageSize),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching lineups by map:', error);
    return [];
  }
};

export const getFilteredLineups = async (mapId, filters = {}, pageSize = DEFAULT_PAGE_SIZE) => {
  try {
    const constraints = [
      where('mapId', '==', mapId),
      where('isPublic', '==', true),
    ];
    if (filters.side) constraints.push(where('side', '==', filters.side));
    if (filters.site) constraints.push(where('site', '==', filters.site));
    if (filters.nadeType) constraints.push(where('nadeType', '==', filters.nadeType));
    constraints.push(orderBy('uploadedAt', 'desc'));
    constraints.push(limit(pageSize));

    const q = query(collection(db, 'lineups'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching filtered lineups:', error);
    return [];
  }
};

export const getHotLineups = async (limitCount = DEFAULT_PAGE_SIZE) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('isPublic', '==', true),
      orderBy('upvotes', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching hot lineups:', error);
    return [];
  }
};

export const getLineupsByCreator = async (creatorId, pageSize = DEFAULT_PAGE_SIZE) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('creatorId', '==', creatorId),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc'),
      limit(pageSize),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching lineups by creator:', error);
    return [];
  }
};

export const getCreatorLineupsByMapAndSide = async (
  creatorId,
  mapId,
  side,
  pageSize = DEFAULT_PAGE_SIZE,
) => {
  if (!creatorId) return [];
  try {
    const constraints = [where('creatorId', '==', creatorId)];
    if (mapId) constraints.push(where('mapId', '==', mapId));
    if (side) constraints.push(where('side', '==', side));
    constraints.push(orderBy('uploadedAt', 'desc'));
    constraints.push(limit(pageSize));

    const q = query(collection(db, 'lineups'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching creator lineups by map/side:', error);
    return [];
  }
};

export const getLineupById = async (lineupId) => {
  try {
    const docRef = doc(db, 'lineups', lineupId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching lineup by ID:', error);
    return null;
  }
};

export const getRecentLineups = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      where('isPublic', '==', true),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('Error fetching recent lineups:', error);
    return [];
  }
};

// ---- Cursor-paginated variants — preferred for new code ----

export const getLineupsByMapPaged = async (
  mapId,
  { pageSize = DEFAULT_PAGE_SIZE, lastDoc = null } = {},
) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      ...withCursor(
        [
          where('mapId', '==', mapId),
          where('isPublic', '==', true),
          orderBy('uploadedAt', 'desc'),
        ],
        { pageSize, lastDoc },
      ),
    );
    const snapshot = await getDocs(q);
    return buildPage(snapshot);
  } catch (error) {
    console.error('Error fetching paged lineups by map:', error);
    return { lineups: [], lastDoc: null, hasMore: false };
  }
};

export const getLineupsByCreatorPaged = async (
  creatorId,
  { pageSize = DEFAULT_PAGE_SIZE, lastDoc = null } = {},
) => {
  try {
    const q = query(
      collection(db, 'lineups'),
      ...withCursor(
        [
          where('creatorId', '==', creatorId),
          where('isPublic', '==', true),
          orderBy('uploadedAt', 'desc'),
        ],
        { pageSize, lastDoc },
      ),
    );
    const snapshot = await getDocs(q);
    return buildPage(snapshot);
  } catch (error) {
    console.error('Error fetching paged lineups by creator:', error);
    return { lineups: [], lastDoc: null, hasMore: false };
  }
};
