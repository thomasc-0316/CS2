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
  deleteObject: jest.fn(),
};

jest.mock('firebase/firestore', () => mockFirestore);
jest.mock('firebase/storage', () => mockStorage);

const {
  createLineupPost,
  updateLineupPost,
  deleteLineupPost,
} = require('../../services/postService');

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      blob: async () => ({ close: jest.fn() }),
    });
    mockStorage.getDownloadURL.mockResolvedValue('https://example.com/image.jpg');
    mockStorage.uploadBytes.mockResolvedValue(undefined);
  });

  it('creates a lineup post and returns the new id', async () => {
    mockFirestore.addDoc.mockResolvedValue({ id: 'lineup-123' });

    const postData = {
      title: 'New lineup',
      description: 'desc',
      throwInstructions: 'run',
      mapId: 'dust2',
      side: 'T',
      site: 'A',
      nadeType: 'smoke',
      standImage: 'file:///stand.jpg',
      aimImage: 'file:///aim.jpg',
      landImage: 'file:///land.jpg',
      moreDetailsImage: null,
    };

    const currentUser = {
      uid: 'user-1',
      email: 'user@example.com',
      profile: { username: 'user1' },
    };

    const id = await createLineupPost(postData, currentUser);
    expect(id).toBe('lineup-123');
    expect(mockFirestore.addDoc).toHaveBeenCalled();
  });

  it('rejects createLineupPost when unauthenticated', async () => {
    await expect(createLineupPost({}, null)).rejects.toThrow(
      'User must be authenticated to post'
    );
  });

  it('bubbles upload errors when creating a lineup', async () => {
    mockFirestore.addDoc.mockResolvedValue({ id: 'lineup-123' });
    mockStorage.uploadBytes.mockRejectedValue(new Error('upload failed'));

    const postData = {
      title: 'New lineup',
      description: 'desc',
      throwInstructions: 'run',
      mapId: 'dust2',
      side: 'T',
      site: 'A',
      nadeType: 'smoke',
      standImage: 'file:///stand.jpg',
      aimImage: 'file:///aim.jpg',
      landImage: 'file:///land.jpg',
      moreDetailsImage: null,
    };

    const currentUser = {
      uid: 'user-1',
      email: 'user@example.com',
      profile: { username: 'user1' },
    };

    await expect(createLineupPost(postData, currentUser)).rejects.toThrow(
      'Failed to upload stand image'
    );
  });

  it('updates a lineup post when owner', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        creatorId: 'user-1',
        standImage: 'file:///stand.jpg',
        aimImage: 'file:///aim.jpg',
        landImage: 'file:///land.jpg',
        moreDetailsImage: null,
      }),
    });

    const postData = {
      title: 'Updated',
      description: '',
      throwInstructions: '',
      side: 'T',
      site: 'A',
      nadeType: 'smoke',
      standImage: 'file:///stand.jpg',
      aimImage: 'file:///aim.jpg',
      landImage: 'file:///land.jpg',
      moreDetailsImage: null,
    };

    await updateLineupPost('lineup-1', postData, { uid: 'user-1' });
    expect(mockFirestore.updateDoc).toHaveBeenCalled();
  });

  it('rejects updateLineupPost when not owner', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        creatorId: 'user-2',
      }),
    });

    await expect(
      updateLineupPost('lineup-1', { title: 'x' }, { uid: 'user-1' })
    ).rejects.toThrow('You can only edit your own posts');
  });

  it('deletes a lineup post when owner', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        creatorId: 'user-1',
      }),
    });

    await deleteLineupPost('lineup-1', { uid: 'user-1' });
    expect(mockFirestore.deleteDoc).toHaveBeenCalled();
  });

  it('rejects deleteLineupPost when not owner', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        creatorId: 'user-2',
      }),
    });

    await expect(
      deleteLineupPost('lineup-1', { uid: 'user-1' })
    ).rejects.toThrow('You can only delete your own posts');
  });
});
