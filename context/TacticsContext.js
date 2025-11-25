import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Timestamp,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const TacticsContext = createContext();

const DRAFT_DURATION_MS = 10000;
const MAX_PLAYERS = 5;
const MAX_GRENADES_PER_PLAYER = 4;
const PHASES = {
  MAP_SELECT: 'MAP_SELECT',
  PREP: 'PREP',
  TACTIC_VOTE: 'TACTIC_VOTE',
  THROW_DRAFT: 'THROW_DRAFT',
  EXECUTION: 'EXECUTION',
};
const DEFAULT_SIDE = 'T';
const DEFAULT_TACTIC_SOURCE = 'default';

const getDefaultUsername = (uid) => `Player-${uid.slice(-4)}`;

export const TacticsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildPlayer = (firebaseUser) => {
    if (!firebaseUser) return null;
    const profile = firebaseUser.profile || {};
    const username =
      profile.username ||
      firebaseUser.displayName ||
      getDefaultUsername(firebaseUser.uid);
    const profilePicture =
      profile.profilePicture || firebaseUser.photoURL || null;

    return {
      uid: firebaseUser.uid,
      username,
      avatar: profilePicture,
      profilePicture,
    };
  };

  // Mirror authenticated user from AuthContext; no anonymous login
  useEffect(() => {
    setUser(currentUser || null);
  }, [currentUser]);

  // Listen to room changes
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      return undefined;
    }

    const roomRef = doc(collection(db, 'rooms'), roomCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRoom(null);
        setRoomCode('');
        return;
      }
      setRoom({
        code: roomCode,
        ...snapshot.data(),
      });
    });

    return () => unsubscribe();
  }, [roomCode]);

  const isIGL = useMemo(() => {
    if (!room || !user) return false;
    return room.iglId === user.uid;
  }, [room, user]);

  const scheduleTimestamp = useCallback((delay) => {
    return Timestamp.fromDate(new Date(Date.now() + delay));
  }, []);

  const handlePhaseAdvance = useCallback(async () => {
    if (!isIGL || !roomCode || !room) return;

    const roomRef = doc(db, 'rooms', roomCode);

    if (room.phase === PHASES.THROW_DRAFT || room.phase === 'SELECTION') {
      await updateDoc(roomRef, {
        phase: PHASES.EXECUTION,
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    }
  }, [isIGL, room, roomCode]);

  // Automatic phase transitions controlled by the IGL to avoid conflicting writes
  useEffect(() => {
    if (!room || !isIGL || !room.timerEnd || room.timerPaused) return;
    const timerEnd = room.timerEnd?.toDate?.() || new Date(room.timerEnd);
    const timeUntilEnd = timerEnd.getTime() - Date.now();

    if (timeUntilEnd <= 0) {
      handlePhaseAdvance();
      return;
    }

    const timeoutId = setTimeout(() => {
      handlePhaseAdvance();
    }, timeUntilEnd);

    return () => clearTimeout(timeoutId);
  }, [room?.phase, room?.timerEnd, room?.timerPaused, isIGL, handlePhaseAdvance]);

  const createRoom = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      let newCode = '';
      let existing = true;

      while (existing) {
        newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const docRef = doc(db, 'rooms', newCode);
        const docSnap = await getDoc(docRef);
        existing = docSnap.exists();
      }

      const newRoom = {
        iglId: user.uid,
        mapId: null,
        phase: PHASES.MAP_SELECT,
        activeTacticId: null,
        tacticVotes: {},
        tacticSource: DEFAULT_TACTIC_SOURCE,
        side: DEFAULT_SIDE,
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
        grenadeSelections: {},
        players: [buildPlayer(user)],
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'rooms', newCode), newRoom);
      setRoomCode(newCode);
    } catch (err) {
      console.error('Failed to create room', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinRoom = useCallback(
    async (code) => {
      if (!user || !code) return;
      setLoading(true);
      setError('');

      try {
        const roomRef = doc(db, 'rooms', code);
        await runTransaction(db, async (transaction) => {
          const roomSnap = await transaction.get(roomRef);
          if (!roomSnap.exists()) {
            throw new Error('Room not found.');
          }

          const roomData = roomSnap.data();
          const players = roomData.players || [];

          const alreadyIn = players.some((p) => p.uid === user.uid);
          if (alreadyIn) {
            return;
          }

          if (players.length >= MAX_PLAYERS) {
            throw new Error('Room is full.');
          }

          transaction.update(roomRef, {
            players: [
              ...players,
              buildPlayer(user),
            ],
          });
        });

        setRoomCode(code);
      } catch (err) {
        console.error('Failed to join room', err);
        setError(err.message || 'Failed to join room.');
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const setMap = useCallback(
    async (mapId) => {
      if (!roomCode || !isIGL) return;
      try {
        await updateDoc(doc(db, 'rooms', roomCode), { mapId });
      } catch (err) {
        console.error('Failed to set map', err);
        setError('Unable to set map.');
      }
    },
    [roomCode, isIGL],
  );

  const goToPrepPhase = useCallback(async () => {
    if (!roomCode || !isIGL) return;
    if (!room?.mapId) {
      setError('Select a map before continuing.');
      return;
    }
    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        phase: PHASES.PREP,
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    } catch (err) {
      console.error('Failed to open lobby', err);
      setError('Unable to open lobby.');
    }
  }, [roomCode, isIGL, room?.mapId]);

  const returnToMapSelect = useCallback(async () => {
    if (!roomCode || !isIGL) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        phase: PHASES.MAP_SELECT,
        activeTacticId: null,
        tacticVotes: {},
        grenadeSelections: {},
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    } catch (err) {
      console.error('Failed to return to map select', err);
      setError('Unable to return to map select.');
    }
  }, [roomCode, isIGL]);

  const startMatch = useCallback(async () => {
    if (!roomCode || !isIGL || !room?.mapId) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        phase: PHASES.TACTIC_VOTE,
        activeTacticId: null,
        tacticVotes: {},
        grenadeSelections: {},
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    } catch (err) {
      console.error('Failed to start match', err);
      setError('Unable to start match.');
    }
  }, [roomCode, isIGL, room?.mapId]);

  const setSideSelection = useCallback(
    async (side) => {
      if (!roomCode || !isIGL || !['T', 'CT'].includes(side)) return;
      try {
        await updateDoc(doc(db, 'rooms', roomCode), { side });
      } catch (err) {
        console.error('Failed to set side', err);
        setError('Unable to set side.');
      }
    },
    [roomCode, isIGL],
  );

  const setTacticSource = useCallback(
    async (source) => {
      if (!roomCode || !isIGL) return;
      if (!['default', 'personal'].includes(source)) return;
      try {
        await updateDoc(doc(db, 'rooms', roomCode), { tacticSource: source });
      } catch (err) {
        console.error('Failed to set tactic source', err);
        setError('Unable to update tactic source.');
      }
    },
    [roomCode, isIGL],
  );

  const voteForTactic = useCallback(
    async (tacticId) => {
      if (!roomCode || !user || !tacticId) return;
      const roomRef = doc(db, 'rooms', roomCode);

      try {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(roomRef);
          if (!snapshot.exists()) return;

          const data = snapshot.data();
          const votes = data.tacticVotes || {};

          const cleaned = Object.entries(votes).reduce((acc, [id, voters]) => {
            const filtered = (voters || []).filter((uid) => uid !== user.uid);
            if (filtered.length) {
              acc[id] = filtered;
            }
            return acc;
          }, {});

          const alreadyVoted = (votes[tacticId] || []).includes(user.uid);
          if (!alreadyVoted) {
            cleaned[tacticId] = [...(cleaned[tacticId] || []), user.uid];
          }

          transaction.update(roomRef, { tacticVotes: cleaned });
        });
      } catch (err) {
        console.error('Failed to vote tactic', err);
        setError('Unable to register vote.');
      }
    },
    [roomCode, user],
  );

  const startGrenadeDraft = useCallback(
    async (tacticId, mapId) => {
      if (!roomCode || !isIGL || !tacticId || !mapId) return;
      try {
        await updateDoc(doc(db, 'rooms', roomCode), {
          mapId,
          activeTacticId: tacticId,
          phase: PHASES.THROW_DRAFT,
          timerEnd: scheduleTimestamp(DRAFT_DURATION_MS),
          timerPaused: false,
          pausedRemainingMs: null,
          grenadeSelections: {},
        });
      } catch (err) {
        console.error('Failed to start tactic', err);
        setError('Unable to start tactic.');
      }
    },
    [roomCode, isIGL, scheduleTimestamp],
  );

  const selectGrenade = useCallback(
    async (grenadeId) => {
      if (
        !roomCode ||
        !user ||
        !room ||
        (room.phase !== PHASES.THROW_DRAFT && room.phase !== 'SELECTION')
      )
        return;

      const selections = room.grenadeSelections || {};
      const claimedBy = selections[grenadeId];

      if (claimedBy && claimedBy !== user.uid) {
        return;
      }

      const claimedCount = Object.values(selections).filter(
        (uid) => uid === user.uid,
      ).length;

      if (!claimedBy && claimedCount >= MAX_GRENADES_PER_PLAYER) {
        setError('You can only hold 4 grenades.');
        return;
      }

      try {
        const roomRef = doc(db, 'rooms', roomCode);
        const fieldPath = `grenadeSelections.${grenadeId}`;
        if (claimedBy === user.uid) {
          await updateDoc(roomRef, {
            [fieldPath]: deleteField(),
          });
        } else {
          await updateDoc(roomRef, {
            [fieldPath]: user.uid,
          });
        }
      } catch (err) {
        console.error('Failed to select grenade', err);
        setError('Unable to update grenade selection.');
      }
    },
    [roomCode, user, room],
  );

  const toggleTimerPause = useCallback(async () => {
    if (!roomCode || !isIGL || !room || room.phase !== PHASES.THROW_DRAFT) {
      return;
    }

    const roomRef = doc(db, 'rooms', roomCode);
    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(roomRef);
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.timerPaused) {
          const remaining =
            data.pausedRemainingMs && data.pausedRemainingMs > 0
              ? data.pausedRemainingMs
              : DRAFT_DURATION_MS;
          transaction.update(roomRef, {
            timerPaused: false,
            pausedRemainingMs: null,
            timerEnd: Timestamp.fromDate(new Date(Date.now() + remaining)),
          });
        } else if (data.timerEnd) {
          const end = data.timerEnd?.toDate?.() || new Date(data.timerEnd);
          const remaining = Math.max(0, end.getTime() - Date.now());
          transaction.update(roomRef, {
            timerPaused: true,
            pausedRemainingMs: remaining,
            timerEnd: null,
          });
        }
      });
    } catch (err) {
      console.error('Failed to toggle timer', err);
      setError('Unable to update timer.');
    }
  }, [roomCode, isIGL, room]);

  const skipToExecution = useCallback(async () => {
    if (!roomCode || !isIGL) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        phase: PHASES.EXECUTION,
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    } catch (err) {
      console.error('Failed to skip timer', err);
      setError('Unable to skip timer.');
    }
  }, [roomCode, isIGL]);

  const endRound = useCallback(async () => {
    if (!roomCode || !isIGL) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        phase: PHASES.TACTIC_VOTE,
        activeTacticId: null,
        tacticVotes: {},
        grenadeSelections: {},
        timerEnd: null,
        timerPaused: false,
        pausedRemainingMs: null,
      });
    } catch (err) {
      console.error('Failed to end round', err);
      setError('Unable to end round.');
    }
  }, [roomCode, isIGL]);

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !user) {
      setRoomCode('');
      setRoom(null);
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) {
          return;
        }

        const roomData = roomSnap.data();
        const updatedPlayers = (roomData.players || []).filter(
          (player) => player.uid !== user.uid,
        );

        if (updatedPlayers.length === 0) {
          transaction.delete(roomRef);
          return;
        }

        // If IGL leaves, assign new IGL
        const nextIglId =
          roomData.iglId === user.uid
            ? updatedPlayers[0]?.uid || null
            : roomData.iglId;

        const cleanedVotes = Object.entries(roomData.tacticVotes || {}).reduce(
          (acc, [id, voters]) => {
            const remaining = (voters || []).filter((uid) => uid !== user.uid);
            if (remaining.length) {
              acc[id] = remaining;
            }
            return acc;
          },
          {},
        );

        transaction.update(roomRef, {
          players: updatedPlayers,
          iglId: nextIglId,
          grenadeSelections: Object.fromEntries(
            Object.entries(roomData.grenadeSelections || {}).filter(
              ([, uid]) => uid !== user.uid,
            ),
          ),
          tacticVotes: cleanedVotes,
        });
      });
    } catch (err) {
      console.error('Failed to leave room', err);
    } finally {
      setRoomCode('');
      setRoom(null);
    }
  }, [roomCode, user]);

  const value = useMemo(
    () => ({
      user,
      room,
      roomCode,
      isIGL,
      loading,
      error,
      createRoom,
      joinRoom,
      setMap,
      goToPrepPhase,
      returnToMapSelect,
      startMatch,
      setSide: setSideSelection,
      setTacticSource,
      voteForTactic,
      startGrenadeDraft,
      selectGrenade,
      toggleTimerPause,
      skipToExecution,
      endRound,
      leaveRoom,
      clearError: () => setError(''),
    }),
    [
      user,
      room,
      roomCode,
      isIGL,
      loading,
      error,
      createRoom,
      joinRoom,
      setMap,
      goToPrepPhase,
      returnToMapSelect,
      startMatch,
      setSideSelection,
      setTacticSource,
      voteForTactic,
      startGrenadeDraft,
      selectGrenade,
      toggleTimerPause,
      skipToExecution,
      endRound,
      leaveRoom,
    ],
  );

  return (
    <TacticsContext.Provider value={value}>
      {children}
    </TacticsContext.Provider>
  );
};

export const useTactics = () => {
  const context = useContext(TacticsContext);
  if (!context) {
    throw new Error('useTactics must be used within a TacticsProvider');
  }
  return context;
};
