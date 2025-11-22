import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import ImageView from 'react-native-image-viewing';
import { MAPS } from '../data/maps';
import { TACTICS } from '../data/tactics';
import { LINEUPS } from '../data/lineups';
import { useTactics } from '../context/TacticsContext';

const DECISION_WINDOW_MS = 10000;

export default function TacticsScreen() {
  const {
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
    clearError,
    user,
  } = useTactics();

  const [joinCode, setJoinCode] = useState('');
  const [pendingTacticId, setPendingTacticId] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [decisionDeadline, setDecisionDeadline] = useState(null);
  const [decisionCountdown, setDecisionCountdown] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const latestRoomRef = useRef(room);
  const autoPickTriggeredRef = useRef(false);

  useEffect(() => {
    latestRoomRef.current = room;
  }, [room]);

  useEffect(() => {
    if (!room) {
      autoPickTriggeredRef.current = false;
      return;
    }
    if (room.phase !== 'LOBBY') {
      autoPickTriggeredRef.current = false;
    }
  }, [room]);

  const lineupsById = useMemo(() => {
    return LINEUPS.reduce((acc, lineup) => {
      acc[lineup.id] = lineup;
      return acc;
    }, {});
  }, []);

  const filteredTactics = useMemo(() => {
    if (!room?.mapId) return [];
    return TACTICS.filter((tactic) => tactic.mapId === room.mapId);
  }, [room?.mapId]);

  const activeTactic = useMemo(() => {
    if (!room?.activeTacticId) return null;
    return TACTICS.find((tactic) => tactic.id === room.activeTacticId) || null;
  }, [room?.activeTacticId]);

  const selectionLineups = useMemo(() => {
    if (!activeTactic) return [];
    return activeTactic.lineupIds
      .map((lineupId) => lineupsById[lineupId])
      .filter(Boolean);
  }, [activeTactic, lineupsById]);

  const myGrenades = useMemo(() => {
    if (!room || !user) return [];
    const myIds = Object.entries(room.grenadeSelections || {})
      .filter(([, uid]) => uid === user.uid)
      .map(([grenadeId]) => Number(grenadeId));
    return myIds.map((id) => lineupsById[id]).filter(Boolean);
  }, [room, user, lineupsById]);

  useEffect(() => {
    setPendingTacticId(room?.activeTacticId || null);
  }, [room?.activeTacticId]);

  useEffect(() => {
    if (!room?.timerEnd) {
      setTimerRemaining(0);
      return;
    }

    const updateTimer = () => {
      const end = room.timerEnd?.toDate?.() || new Date(room.timerEnd);
      const diff = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 1000));
      setTimerRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [room?.timerEnd, room?.phase]);

  useEffect(() => {
    if (!room || room.phase !== 'LOBBY' || room.activeTacticId) {
      setDecisionDeadline(null);
      setDecisionCountdown(0);
      return;
    }
    if (autoPickTriggeredRef.current) {
      return;
    }
    setDecisionDeadline((prev) => prev ?? Date.now() + DECISION_WINDOW_MS);
  }, [room?.phase, room?.activeTacticId, room?.code]);

  useEffect(() => {
    if (!decisionDeadline) {
      setDecisionCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const diff = Math.max(
        0,
        Math.ceil((decisionDeadline - Date.now()) / 1000),
      );
      setDecisionCountdown(diff);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 500);
    return () => clearInterval(intervalId);
  }, [decisionDeadline]);

  const triggerAutoPick = useCallback(() => {
    if (autoPickTriggeredRef.current) {
      return;
    }
    autoPickTriggeredRef.current = true;
    const currentRoom = latestRoomRef.current;
    const tacticForMap = currentRoom?.mapId
      ? TACTICS.find((t) => t.mapId === currentRoom.mapId)
      : null;
    const fallbackTactic = tacticForMap || TACTICS[0];
    if (!fallbackTactic) {
      setDecisionDeadline(null);
      return;
    }
    setPendingTacticId(fallbackTactic.id);
    startTactic(fallbackTactic.id, fallbackTactic.mapId);
    setDecisionDeadline(null);
  }, [startTactic]);

  useEffect(() => {
    if (
      !isIGL ||
      !room ||
      room.phase !== 'LOBBY' ||
      room.activeTacticId ||
      !decisionDeadline
    ) {
      return;
    }

    const remaining = Math.max(0, decisionDeadline - Date.now());
    if (remaining === 0) {
      triggerAutoPick();
      return;
    }

    const timeoutId = setTimeout(triggerAutoPick, remaining);
    return () => clearTimeout(timeoutId);
  }, [
    isIGL,
    room?.phase,
    room?.activeTacticId,
    decisionDeadline,
    triggerAutoPick,
  ]);

  const getImageUri = useCallback((imageSource) => {
    if (!imageSource) return null;
    if (typeof imageSource === 'string') {
      return imageSource;
    }
    try {
      const asset = Asset.fromModule(imageSource);
      return asset.localUri || asset.uri;
    } catch (err) {
      return null;
    }
  }, []);

  const handleImagePress = useCallback(
    (imageSource) => {
      const uri = getImageUri(imageSource);
      if (!uri) return;
      setViewerImages([{ uri }]);
      setImageViewerVisible(true);
    },
    [getImageUri],
  );

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code.length === 6) {
      joinRoom(code);
    }
  };

  const handleStartTactic = () => {
    if (room?.mapId && pendingTacticId) {
      setDecisionDeadline(null);
      autoPickTriggeredRef.current = true;
      startTactic(pendingTacticId, room.mapId);
    }
  };

  const selectionDisabled = room?.phase !== 'SELECTION';

  if (roomCode && !room) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FF6800" size="large" />
        <Text style={styles.loadingText}>Connecting to tactics room...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.landingContainer}
      >
        <Text style={styles.heading}>Tactics Room</Text>
        <Text style={styles.subheading}>
          Create a room as the IGL or join using a 6-digit code.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="Enter 6-digit room code"
          placeholderTextColor="#777"
          style={styles.input}
          maxLength={6}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[styles.primaryButton, joinCode.length !== 6 && styles.disabled]}
          onPress={handleJoin}
          disabled={joinCode.length !== 6 || loading}
        >
          <Text style={styles.buttonText}>Join Room</Text>
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>or</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={createRoom}
          disabled={loading}
        >
          <Text style={styles.secondaryText}>Create Room</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#FF6800" />
        ) : null}
      </ScrollView>
    );
  }

  const renderPlayer = (player) => {
    const isLeader = room?.iglId === player.uid;
    return (
      <View key={player.uid} style={styles.playerPill}>
        <Text style={styles.playerText}>
          {player.username}
          {isLeader ? ' (IGL)' : ''}
        </Text>
      </View>
    );
  };

  const renderMapOption = (map) => {
    const isSelected = room?.mapId === map.id;
    return (
      <TouchableOpacity
        key={map.id}
        style={[
          styles.mapCard,
          isSelected && styles.mapCardSelected,
          !isIGL && styles.disabledCard,
        ]}
        onPress={() => isIGL && setMap(map.id)}
        disabled={!isIGL}
      >
        <Text style={styles.mapName}>{map.name}</Text>
        <Text style={styles.mapStatus}>{map.isLocked ? 'Locked' : 'Active'}</Text>
      </TouchableOpacity>
    );
  };

  const renderTacticOption = (tactic) => {
    const isActive = pendingTacticId === tactic.id;
    const isDisabled = !isIGL;

    return (
      <TouchableOpacity
        key={tactic.id}
        style={[
          styles.tacticCard,
          isActive && styles.tacticActive,
          isDisabled && styles.disabledCard,
        ]}
        onPress={() => isIGL && setPendingTacticId(tactic.id)}
        disabled={isDisabled}
      >
        <Text style={styles.tacticTitle}>{tactic.title}</Text>
        <Text style={styles.tacticDescription}>{tactic.description}</Text>
        <Text style={styles.tacticMeta}>
          {tactic.lineupIds.length} grenades
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGrenadeCard = (lineup) => {
    const claimedBy = room?.grenadeSelections?.[lineup.id];
    const ownedByMe = claimedBy === user?.uid;
    const takenByOther = claimedBy && !ownedByMe;
    return (
      <TouchableOpacity
        key={lineup.id}
        style={[
          styles.grenadeCard,
          ownedByMe && styles.grenadeOwned,
          takenByOther && styles.grenadeTaken,
        ]}
        disabled={takenByOther || selectionDisabled}
        onPress={() => selectGrenade(lineup.id)}
      >
        <Text style={styles.grenadeTitle}>{lineup.title}</Text>
        <Text style={styles.grenadeMeta}>
          {lineup.nadeType} • {lineup.site}
        </Text>
        <Text style={styles.grenadeMeta}>#{lineup.id}</Text>
      </TouchableOpacity>
    );
  };

  const renderExecutionCard = (lineup) => {
    return (
      <View key={lineup.id} style={styles.executionCard}>
        <Text style={styles.grenadeTitle}>{lineup.title}</Text>
        <Text style={styles.grenadeMeta}>
          Stand here & aim here to throw your {lineup.nadeType}.
        </Text>
        <View style={styles.executionImages}>
          <TouchableOpacity
            onPress={() => handleImagePress(lineup.standImage)}
            activeOpacity={0.9}
            style={styles.executionImageWrapper}
          >
            <Image source={lineup.standImage} style={styles.executionImage} />
            <Text style={styles.executionImageLabel}>Stand Position</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleImagePress(lineup.aimImage)}
            activeOpacity={0.9}
            style={styles.executionImageWrapper}
          >
            <Image source={lineup.aimImage} style={styles.executionImage} />
            <Text style={styles.executionImageLabel}>Aim Spot</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const canStartDraft =
    isIGL &&
    room.phase !== 'SELECTION' &&
    room.phase !== 'EXECUTION' &&
    room.mapId &&
    pendingTacticId;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.screenContainer}
      >
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.heading}>Room Code: {room?.code}</Text>
            <TouchableOpacity onPress={leaveRoom}>
              <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subheading}>
          Phase: {room?.phase || 'LOBBY'}
          {room?.phase !== 'LOBBY' && room?.timerEnd
            ? ` • ${timerRemaining}s`
            : ''}
        </Text>
        <View style={styles.playerList}>
          {(room?.players || []).map(renderPlayer)}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Map</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MAPS.map(renderMapOption)}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Tactic</Text>
        {room?.mapId ? (
          filteredTactics.length ? (
            filteredTactics.map(renderTacticOption)
          ) : (
            <Text style={styles.emptyText}>
              No tactics available for this map yet.
            </Text>
          )
        ) : (
          <Text style={styles.emptyText}>Select a map to view tactics.</Text>
        )}
        {room.phase === 'LOBBY' && !room.activeTacticId && decisionCountdown > 0 ? (
          <Text style={styles.countdownText}>
            {isIGL ? 'Auto-selecting default tactic' : 'IGL will auto-select'} in{' '}
            {decisionCountdown}s
          </Text>
        ) : null}
        {isIGL ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !canStartDraft && styles.disabled,
              { marginTop: 16 },
            ]}
            onPress={handleStartTactic}
            disabled={!canStartDraft}
          >
            <Text style={styles.buttonText}>Start Grenade Draft</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {room.phase === 'SELECTION' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Grenade Draft • {timerRemaining}s
          </Text>
          <View style={styles.grenadeGrid}>
            {selectionLineups.map(renderGrenadeCard)}
          </View>
          {selectionLineups.length === 0 ? (
            <Text style={styles.emptyText}>
              Waiting for the IGL to choose a tactic.
            </Text>
          ) : null}
        </View>
      )}

      {room.phase === 'EXECUTION' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Grenades • {timerRemaining}s
          </Text>
          {myGrenades.length ? (
            myGrenades.map(renderExecutionCard)
          ) : (
            <Text style={styles.emptyText}>
              You did not claim any grenades in this draft.
            </Text>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#FF6800" />
      ) : null}
      </ScrollView>
      <ImageView
        images={viewerImages}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  screenContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 60,
    backgroundColor: '#0a0a0a',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subheading: {
    color: '#aaa',
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  playerPill: {
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  playerText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  mapCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1c1c1c',
    marginRight: 12,
    width: 140,
  },
  mapCardSelected: {
    borderWidth: 1,
    borderColor: '#FF6800',
  },
  mapName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  mapStatus: {
    marginTop: 6,
    color: '#888',
    fontSize: 12,
  },
  tacticCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#1a1a1a',
    marginBottom: 12,
  },
  tacticActive: {
    borderColor: '#FF6800',
    backgroundColor: '#1e1308',
  },
  tacticTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  tacticDescription: {
    color: '#bbb',
    marginBottom: 6,
  },
  tacticMeta: {
    color: '#777',
    fontSize: 12,
  },
  grenadeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  grenadeCard: {
    width: '48%',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  grenadeOwned: {
    borderWidth: 2,
    borderColor: '#32a852',
    backgroundColor: '#102215',
  },
  grenadeTaken: {
    borderWidth: 1,
    borderColor: '#a83232',
    backgroundColor: '#2a0c0c',
  },
  grenadeTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
  },
  grenadeMeta: {
    color: '#888',
    fontSize: 12,
  },
  executionCard: {
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
  },
  executionImages: {
    marginTop: 12,
  },
  executionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  executionImageWrapper: {
    marginBottom: 14,
  },
  executionImageLabel: {
    marginTop: 6,
    color: '#888',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 12,
    color: '#bbb',
  },
  landingContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    paddingTop: 80,
  },
  input: {
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6800',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#FF6800',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryText: {
    color: '#FF6800',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledCard: {
    opacity: 0.7,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  separatorText: {
    color: '#777',
    marginHorizontal: 10,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#3b1111',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a83232',
  },
  errorText: {
    color: '#ff8f8f',
    marginBottom: 6,
  },
  errorDismiss: {
    color: '#fff',
    fontWeight: '600',
  },
  leaveText: {
    color: '#f65f5f',
    fontWeight: '600',
  },
  emptyText: {
    color: '#777',
    fontStyle: 'italic',
  },
  countdownText: {
    marginTop: 8,
    color: '#FF6800',
    fontSize: 13,
  },
});
