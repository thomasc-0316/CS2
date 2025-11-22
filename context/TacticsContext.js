import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
import { auth, db } from '../firebaseConfig';

const TacticsContext = createContext();

const SELECTION_DURATION = 10000;
const EXECUTION_DURATION = 30000;
const MAX_PLAYERS = 5;
const MAX_GRENADES_PER_PLAYER = 4;

const getDefaultUsername = (uid) => `Player-${uid.slice(-4)}`;

export const TacticsProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in anonymously on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        return;
      }
      try {
        const credential = await signInAnonymously(auth);
        setUser(credential.user);
      } catch (err) {
        console.error('Failed to sign in anonymously', err);
        setError('Unable to authenticate user.');
      }
    });

    return () => unsubscribe();
  }, []);

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

    if (room.phase === 'SELECTION') {
      await updateDoc(roomRef, {
        phase: 'EXECUTION',
        timerEnd: scheduleTimestamp(EXECUTION_DURATION),
      });
    } else if (room.phase === 'EXECUTION') {
      await updateDoc(roomRef, {
        phase: 'LOBBY',
        timerEnd: null,
        activeTacticId: null,
        grenadeSelections: {},
      });
    }
  }, [isIGL, room, roomCode, scheduleTimestamp]);

  // Automatic phase transitions controlled by the IGL to avoid conflicting writes
  useEffect(() => {
    if (!room || !isIGL || !room.timerEnd) return;
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
  }, [room, isIGL, handlePhaseAdvance]);

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
        phase: 'LOBBY',
        activeTacticId: null,
        timerEnd: null,
        grenadeSelections: {},
        players: [
          {
            uid: user.uid,
            username: getDefaultUsername(user.uid),
          },
        ],
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
              { uid: user.uid, username: getDefaultUsername(user.uid) },
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

  const startTactic = useCallback(
    async (tacticId, mapId) => {
      if (!roomCode || !isIGL || !tacticId || !mapId) return;
      try {
        await updateDoc(doc(db, 'rooms', roomCode), {
          mapId,
          activeTacticId: tacticId,
          phase: 'SELECTION',
          timerEnd: scheduleTimestamp(SELECTION_DURATION),
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
      if (!roomCode || !user || !room || room.phase !== 'SELECTION') return;

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

        transaction.update(roomRef, {
          players: updatedPlayers,
          iglId: nextIglId,
          grenadeSelections: Object.fromEntries(
            Object.entries(roomData.grenadeSelections || {}).filter(
              ([, uid]) => uid !== user.uid,
            ),
          ),
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
      startTactic,
      selectGrenade,
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
      startTactic,
      selectGrenade,
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
