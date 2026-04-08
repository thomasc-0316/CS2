// Glass-box tests for services/lineupService.
//
// Verifies that every read function passes a `limit()` constraint into the
// underlying Firestore query — this is the regression guard for C6 (the
// previously-unbounded full-collection scans). We also exercise the cursor
// pagination contract for the *Paged variants.

// Variables prefixed with `mock` are explicitly allowed to be referenced
// from inside jest.mock() factory functions.
const mockLimit = jest.fn((n) => ({ __type: 'limit', n }));
const mockOrderBy = jest.fn((f, dir) => ({ __type: 'orderBy', f, dir }));
const mockWhere = jest.fn((f, op, v) => ({ __type: 'where', f, op, v }));
const mockCollection = jest.fn((_db, name) => ({ __type: 'collection', name }));
const mockStartAfter = jest.fn((doc) => ({ __type: 'startAfter', doc }));
const mockQuery = jest.fn((_col, ...constraints) => ({ __type: 'query', constraints }));
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('../../services/firestoreClient', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  orderBy: (...args) => mockOrderBy(...args),
  limit: (...args) => mockLimit(...args),
  startAfter: (...args) => mockStartAfter(...args),
  getDocs: (...args) => mockGetDocs(...args),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
}));

jest.mock('../../firebaseConfig', () => ({ db: {} }));

const makeSnapshot = (lineups) => ({
  docs: lineups.map((l) => ({ id: l.id, data: () => l })),
});

const lastQueryConstraints = () => {
  const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
  return lastCall.slice(1); // drop the collection ref
};

describe('lineupService', () => {
  let svc;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      svc = require('../../services/lineupService');
    });
  });

  describe('always-limited reads (C6 regression guard)', () => {
    it('getLineupsByMap forces a limit() constraint with default page size', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getLineupsByMap('dust2');
      expect(mockLimit).toHaveBeenCalledWith(svc.DEFAULT_PAGE_SIZE);
      const constraints = lastQueryConstraints();
      expect(constraints.some((c) => c?.__type === 'limit')).toBe(true);
    });

    it('getLineupsByMap honors custom page size', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getLineupsByMap('dust2', 7);
      expect(mockLimit).toHaveBeenCalledWith(7);
    });

    it('getFilteredLineups forces a limit() and applies optional filters', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getFilteredLineups('dust2', { side: 'T', site: 'A', nadeType: 'Smoke' });
      expect(mockLimit).toHaveBeenCalledWith(svc.DEFAULT_PAGE_SIZE);
      expect(mockWhere).toHaveBeenCalledWith('side', '==', 'T');
      expect(mockWhere).toHaveBeenCalledWith('site', '==', 'A');
      expect(mockWhere).toHaveBeenCalledWith('nadeType', '==', 'Smoke');
    });

    it('getHotLineups forces a limit()', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getHotLineups();
      expect(mockLimit).toHaveBeenCalledWith(svc.DEFAULT_PAGE_SIZE);
    });

    it('getLineupsByCreator forces a limit()', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getLineupsByCreator('creator-1');
      expect(mockLimit).toHaveBeenCalledWith(svc.DEFAULT_PAGE_SIZE);
    });

    it('getCreatorLineupsByMapAndSide forces a limit()', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getCreatorLineupsByMapAndSide('creator-1', 'dust2', 'T');
      expect(mockLimit).toHaveBeenCalledWith(svc.DEFAULT_PAGE_SIZE);
    });

    it('getRecentLineups forces a limit()', async () => {
      mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));
      await svc.getRecentLineups();
      expect(mockLimit).toHaveBeenCalled();
    });
  });

  describe('error handling returns safe defaults', () => {
    it('getLineupsByMap returns [] on error', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('boom'));
      await expect(svc.getLineupsByMap('dust2')).resolves.toEqual([]);
    });

    it('getCreatorLineupsByMapAndSide returns [] when creatorId missing', async () => {
      const result = await svc.getCreatorLineupsByMapAndSide(null);
      expect(result).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('getLineupById returns null on error', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('boom'));
      await expect(svc.getLineupById('xyz')).resolves.toBeNull();
    });

    it('getLineupById returns null when not found', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      await expect(svc.getLineupById('xyz')).resolves.toBeNull();
    });
  });

  describe('cursor pagination', () => {
    it('getLineupsByMapPaged returns { lineups, lastDoc, hasMore }', async () => {
      const docs = [
        { id: 'a', data: () => ({ title: 'A' }) },
        { id: 'b', data: () => ({ title: 'B' }) },
      ];
      mockGetDocs.mockResolvedValueOnce({ docs });
      const page = await svc.getLineupsByMapPaged('dust2', { pageSize: 2 });
      expect(page.lineups).toHaveLength(2);
      expect(page.lineups[0]).toEqual({ id: 'a', title: 'A' });
      expect(page.lastDoc).toBe(docs[1]);
    });

    it('getLineupsByMapPaged passes lastDoc through startAfter on subsequent calls', async () => {
      const cursor = { id: 'cursor' };
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      await svc.getLineupsByMapPaged('dust2', { pageSize: 5, lastDoc: cursor });
      expect(mockStartAfter).toHaveBeenCalledWith(cursor);
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('getLineupsByCreatorPaged paginates by creator', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'x', data: () => ({}) }] });
      const page = await svc.getLineupsByCreatorPaged('creator-1', { pageSize: 1 });
      expect(page.lineups).toHaveLength(1);
      expect(mockWhere).toHaveBeenCalledWith('creatorId', '==', 'creator-1');
    });

    it('paged variants return safe default on error', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('boom'));
      await expect(svc.getLineupsByMapPaged('dust2')).resolves.toEqual({
        lineups: [],
        lastDoc: null,
        hasMore: false,
      });
    });
  });
});
