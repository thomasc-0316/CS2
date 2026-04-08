import React from 'react';
import { render, act } from '@testing-library/react-native';
import { TacticsProvider, useTactics } from '../../context/TacticsContext';

let mockUser = {
  uid: 'user-1',
  displayName: 'User One',
  profile: { username: 'userone' },
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockUser,
  }),
}));

const mockUnsubscribe = jest.fn();

jest.mock('firebase/firestore', () => {
  const mock = {
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    onSnapshot: jest.fn(),
    runTransaction: jest.fn(),
    doc: jest.fn((...args) => ({ id: args[args.length - 1] })),
    collection: jest.fn((_db, name) => ({ name })),
    Timestamp: {
      now: () => ({ toDate: () => new Date() }),
      fromDate: (date) => ({ toDate: () => date }),
    },
    deleteField: jest.fn(() => ({ _type: 'deleteField' })),
  };

  return {
    getDoc: (...args) => mock.getDoc(...args),
    setDoc: (...args) => mock.setDoc(...args),
    updateDoc: (...args) => mock.updateDoc(...args),
    onSnapshot: (...args) => mock.onSnapshot(...args),
    runTransaction: (...args) => mock.runTransaction(...args),
    doc: (...args) => mock.doc(...args),
    collection: (...args) => mock.collection(...args),
    Timestamp: mock.Timestamp,
    deleteField: (...args) => mock.deleteField(...args),
    __mock: mock,
  };
});

jest.mock('../../firebaseConfig', () => ({
  db: {},
}));

const Harness = React.forwardRef((props, ref) => {
  const tactics = useTactics();
  React.useImperativeHandle(ref, () => tactics, [tactics]);
  return null;
});

describe('TacticsContext', () => {
  let transactionSnapshot;
  let lastTransaction;
  let snapshotCallback;
  let snapshotErrorCallback;
  let firestoreMocks;
  let Timestamp;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionSnapshot = undefined;
    lastTransaction = undefined;
    snapshotCallback = undefined;
    snapshotErrorCallback = undefined;
    firestoreMocks = require('firebase/firestore').__mock;
    Timestamp = firestoreMocks.Timestamp;
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    firestoreMocks.updateDoc.mockResolvedValue();

    firestoreMocks.runTransaction.mockImplementation(async (_db, updateFn) => {
      const transaction = {
        get: jest.fn(async () => transactionSnapshot),
        update: jest.fn(),
        delete: jest.fn(),
      };
      lastTransaction = transaction;
      return updateFn(transaction);
    });

    firestoreMocks.onSnapshot.mockImplementation((_ref, onNext, onError) => {
      snapshotCallback = onNext;
      snapshotErrorCallback = onError;
      return mockUnsubscribe;
    });
  });

  const setup = async () => {
    const ref = React.createRef();
    render(
      <TacticsProvider>
        <Harness ref={ref} />
      </TacticsProvider>
    );
    await act(async () => {});
    act(() => {
      ref.current.setRoomRealtimeEnabled(true);
    });
    return ref;
  };

  it('creates a room with playerIds', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    const payload = firestoreMocks.setDoc.mock.calls[0][1];
    expect(payload.playerIds).toEqual(['user-1']);
    expect(payload.players).toHaveLength(1);
  });

  it('joins a room and updates playerIds', async () => {
    const ref = await setup();
    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        players: [{ uid: 'user-2' }],
      }),
    };

    await act(async () => {
      await ref.current.joinRoom('123456');
    });

    expect(lastTransaction.update).toHaveBeenCalled();
    const updateArgs = lastTransaction.update.mock.calls[0][1];
    expect(updateArgs.playerIds).toEqual(['user-2', 'user-1']);
  });

  it('returns error when room is full', async () => {
    const ref = await setup();
    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        players: [
          { uid: '1' },
          { uid: '2' },
          { uid: '3' },
          { uid: '4' },
          { uid: '5' },
        ],
      }),
    };

    await act(async () => {
      await ref.current.joinRoom('123456');
    });

    expect(ref.current.error).toBe('Room is full.');
  });

  it('leaves a room and removes playerIds', async () => {
    const ref = await setup();
    await act(async () => {
      await ref.current.createRoom();
    });

    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        iglId: 'user-1',
        players: [{ uid: 'user-1' }, { uid: 'user-2' }],
        playerIds: ['user-1', 'user-2'],
        tacticVotes: {},
        grenadeSelections: {},
      }),
    };

    await act(async () => {
      await ref.current.leaveRoom();
    });

    const updateArgs = lastTransaction.update.mock.calls[0][1];
    expect(updateArgs.playerIds).toEqual(['user-2']);
    expect(updateArgs.iglId).toBe('user-2');
  });

  it('deletes room when last player leaves', async () => {
    const ref = await setup();
    await act(async () => {
      await ref.current.createRoom();
    });

    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        iglId: 'user-1',
        players: [{ uid: 'user-1' }],
        playerIds: ['user-1'],
        tacticVotes: {},
        grenadeSelections: {},
      }),
    };

    await act(async () => {
      await ref.current.leaveRoom();
    });

    expect(lastTransaction.delete).toHaveBeenCalled();
  });

  it('replaces previous vote when voting for a new tactic', async () => {
    const ref = await setup();
    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        players: [{ uid: 'user-2' }],
      }),
    };

    await act(async () => {
      await ref.current.joinRoom('123456');
    });

    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        tacticVotes: {
          t1: ['user-1'],
          t2: ['user-2'],
        },
      }),
    };

    await act(async () => {
      await ref.current.voteForTactic('t2');
    });

    const updateArgs = lastTransaction.update.mock.calls[0][1];
    expect(updateArgs.tacticVotes).toEqual({
      t2: ['user-2', 'user-1'],
    });
  });

  it('backfills playerIds when missing on snapshot', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    await act(async () => {});

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          players: [{ uid: 'user-1' }, { uid: 'user-2' }],
        }),
      });
    });

    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
      { id: expect.any(String) },
      { playerIds: ['user-1', 'user-2'] }
    );
  });

  it('selects and releases grenade assignments', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    await act(async () => {});

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          iglId: 'user-1',
          phase: 'THROW_DRAFT',
          grenadeSelections: {},
          players: [{ uid: 'user-1' }],
          playerIds: ['user-1'],
          tacticVotes: {},
        }),
      });
    });

    await act(async () => {
      await ref.current.selectGrenade('g1');
    });

    expect(firestoreMocks.updateDoc).toHaveBeenLastCalledWith(
      { id: expect.any(String) },
      { 'grenadeSelections.g1': 'user-1' }
    );

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          iglId: 'user-1',
          phase: 'THROW_DRAFT',
          grenadeSelections: { g1: 'user-1' },
          players: [{ uid: 'user-1' }],
          playerIds: ['user-1'],
          tacticVotes: {},
        }),
      });
    });

    await act(async () => {
      await ref.current.selectGrenade('g1');
    });

    expect(firestoreMocks.updateDoc).toHaveBeenLastCalledWith(
      { id: expect.any(String) },
      { 'grenadeSelections.g1': expect.objectContaining({ _type: 'deleteField' }) }
    );
  });

  it('blocks grenade selection when at max', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    await act(async () => {});

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          iglId: 'user-1',
          phase: 'THROW_DRAFT',
          grenadeSelections: {
            g1: 'user-1',
            g2: 'user-1',
            g3: 'user-1',
            g4: 'user-1',
          },
          players: [{ uid: 'user-1' }],
          playerIds: ['user-1'],
          tacticVotes: {},
        }),
      });
    });

    await act(async () => {
      await ref.current.selectGrenade('g5');
    });

    expect(ref.current.error).toBe('You can only hold 4 grenades.');
    expect(firestoreMocks.updateDoc).not.toHaveBeenCalled();
  });

  it('toggles timer pause state', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    await act(async () => {});

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({
          iglId: 'user-1',
          phase: 'THROW_DRAFT',
          timerPaused: false,
          timerEnd: Timestamp.fromDate(new Date(Date.now() + 5000)),
          grenadeSelections: {},
          players: [{ uid: 'user-1' }],
          playerIds: ['user-1'],
          tacticVotes: {},
        }),
      });
    });

    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        timerPaused: false,
        timerEnd: Timestamp.fromDate(new Date(Date.now() + 5000)),
        pausedRemainingMs: null,
      }),
    };

    await act(async () => {
      await ref.current.toggleTimerPause();
    });

    const pauseArgs = lastTransaction.update.mock.calls[0][1];
    expect(pauseArgs).toEqual(
      expect.objectContaining({
        timerPaused: true,
        timerEnd: null,
      })
    );

    transactionSnapshot = {
      exists: () => true,
      data: () => ({
        timerPaused: true,
        timerEnd: null,
        pausedRemainingMs: 4000,
      }),
    };

    await act(async () => {
      await ref.current.toggleTimerPause();
    });

    const resumeArgs = lastTransaction.update.mock.calls[0][1];
    expect(resumeArgs.timerPaused).toBe(false);
    expect(resumeArgs.timerEnd).toBeDefined();
    expect(typeof resumeArgs.timerEnd.toDate).toBe('function');
  });

  it('sets error when room sync fails', async () => {
    const ref = await setup();

    await act(async () => {
      await ref.current.createRoom();
    });

    await act(async () => {});

    act(() => {
      snapshotErrorCallback(new Error('denied'));
    });

    expect(ref.current.error).toBe('Unable to sync room.');
  });
});
