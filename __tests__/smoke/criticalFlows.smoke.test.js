jest.mock('../../firebaseConfig', () => ({
  db: {},
  storage: {},
}));

const mockFirestore = {
  collection: jest.fn(() => ({ _type: 'collection' })),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((_db, _col, id) => ({ id })),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  getDoc: jest.fn(),
};

const mockStorage = {
  ref: jest.fn((_storage, path) => ({ path })),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
};

jest.mock('firebase/firestore', () => mockFirestore);
jest.mock('firebase/storage', () => mockStorage);

const {
  createLineupPost,
  updateLineupPost,
  deleteLineupPost,
} = require('../../services/postService');

describe('critical flows smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      blob: async () => ({ close: jest.fn() }),
    });
    mockStorage.uploadBytes.mockResolvedValue(undefined);
    mockStorage.getDownloadURL.mockResolvedValue('https://example.com/image.jpg');
  });

  it('requires authentication before creating a lineup', async () => {
    await expect(createLineupPost({}, null)).rejects.toThrow(
      'User must be authenticated to post'
    );
  });

  it('blocks lineup updates from non-owners', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ creatorId: 'owner-uid' }),
    });

    await expect(
      updateLineupPost('lineup-1', { title: 'updated' }, { uid: 'other-uid' })
    ).rejects.toThrow('You can only edit your own posts');
  });

  it('blocks lineup deletion from non-owners', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ creatorId: 'owner-uid' }),
    });

    await expect(deleteLineupPost('lineup-1', { uid: 'other-uid' })).rejects.toThrow(
      'You can only delete your own posts'
    );
  });
});
