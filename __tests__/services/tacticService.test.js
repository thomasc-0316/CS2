jest.mock('../../firebaseConfig', () => ({
  db: {},
}));

const mockCollection = { _type: 'collection', name: 'tactics' };

const mockFirestore = {
  addDoc: jest.fn(),
  collection: jest.fn(() => mockCollection),
  getDocs: jest.fn(),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  query: jest.fn((...args) => ({ args })),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  where: jest.fn((field, op, value) => ({ field, op, value })),
};

jest.mock('firebase/firestore', () => mockFirestore);

const {
  fetchPublicTactics,
  createTactic,
} = require('../../services/tacticService');

describe('tacticService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps public tactics and supports legacy lineupIds', async () => {
    mockFirestore.getDocs.mockResolvedValue({
      docs: [
        {
          id: 't1',
          data: () => ({
            title: 'B Execute',
            description: 'Fast hit',
            mapId: 'dust2',
            side: 't',
            linupIds: ['1', '2'],
            isTextbook: true,
            isPublic: true,
          }),
        },
      ],
    });

    const tactics = await fetchPublicTactics('dust2', 't');
    expect(tactics).toHaveLength(1);
    expect(tactics[0]).toMatchObject({
      id: 't1',
      title: 'B Execute',
      side: 'T',
      lineupIds: ['1', '2'],
      isTextbook: true,
      isPublic: true,
    });
  });

  it('returns empty list when missing map or side', async () => {
    await expect(fetchPublicTactics(null, 'T')).resolves.toEqual([]);
    await expect(fetchPublicTactics('dust2', null)).resolves.toEqual([]);
  });

  it('creates tactics with normalized payload', async () => {
    mockFirestore.addDoc.mockResolvedValue({ id: 'new-id' });

    const result = await createTactic({
      title: 'Default',
      description: 'desc',
      mapId: 'dust2',
      side: 't',
      lineupIds: [1, 2],
      isPublic: true,
    });

    expect(mockFirestore.addDoc).toHaveBeenCalled();
    expect(result.id).toBe('new-id');
    expect(result.side).toBe('T');
    expect(result.lineupIds).toEqual(['1', '2']);
  });

  it('throws when required fields missing', async () => {
    await expect(createTactic({ side: 'T' })).rejects.toThrow(
      'mapId and side are required to create a tactic'
    );
  });
});
