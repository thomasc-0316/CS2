import React, { useEffect, useMemo, useState } from 'react';
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MAPS } from '../data/maps';
import { TACTICS } from '../data/tactics';
import { useTactics } from '../context/TacticsContext';

const PHASES = {
  MAP_SELECT: 'MAP_SELECT',
  PREP: 'PREP',
  TACTIC_VOTE: 'TACTIC_VOTE',
  THROW_DRAFT: 'THROW_DRAFT',
  EXECUTION: 'EXECUTION',
};

export default function TacticsScreen() {
  const {
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
    setSide,
    setTacticSource,
    voteForTactic,
    startGrenadeDraft,
    selectGrenade,
    toggleTimerPause,
    skipToExecution,
    endRound,
    leaveRoom,
    clearError,
  } = useTactics();

  const [joinCode, setJoinCode] = useState('');
  const [pendingTacticId, setPendingTacticId] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState(null);
  const [mapLineups, setMapLineups] = useState([]);
  const [lineupsLoading, setLineupsLoading] = useState(false);

  const normalizedPhase = useMemo(() => {
    if (!room?.phase) return PHASES.MAP_SELECT;
    if (room.phase === 'LOBBY') return PHASES.MAP_SELECT;
    if (room.phase === 'SELECTION') return PHASES.THROW_DRAFT;
    return room.phase;
  }, [room?.phase]);

  // Fetch lineups for the selected map
  useEffect(() => {
    const fetchMapLineups = async () => {
      if (!room?.mapId) {
        setMapLineups([]);
        return;
      }

      try {
        setLineupsLoading(true);

        const q = query(
          collection(db, 'lineups'),
          where('mapId', '==', room.mapId),
          where('isPublic', '==', true)
        );

        const snapshot = await getDocs(q);
        const lineups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMapLineups(lineups);
      } catch (error) {
        console.error('Error fetching map lineups:', error);
      } finally {
        setLineupsLoading(false);
      }
    };

    fetchMapLineups();
  }, [room?.mapId]);

  useEffect(() => {
    setPendingTacticId(room?.activeTacticId || null);
  }, [room?.activeTacticId]);

  useEffect(() => {
    if (isIGL && filteredTactics.length && !pendingTacticId) {
      setPendingTacticId(filteredTactics[0].id);
    }
  }, [isIGL, filteredTactics, pendingTacticId]);

  useEffect(() => {
    if (myVote && optimisticVote === myVote) {
      setOptimisticVote(null);
    }
  }, [myVote, optimisticVote]);

  useEffect(() => {
    if (!myVote) {
      setOptimisticVote(null);
    }
  }, [myVote]);

  const lineupsById = useMemo(() => {
    return mapLineups.reduce((acc, lineup) => {
      acc[lineup.id] = lineup;
      return acc;
    }, {});
  }, [mapLineups]);

  const players = room?.players || [];
  const map = useMemo(
    () => MAPS.find((item) => item.id === room?.mapId) || null,
    [room?.mapId],
  );
  const tacticSource = room?.tacticSource || 'default';
  const tacticSide = room?.side || 'T';

  const filteredTactics = useMemo(() => {
    if (!room?.mapId) return [];
    return TACTICS.filter(
      (t) =>
        t.mapId === room.mapId &&
        (!t.side || t.side === tacticSide) &&
        (!t.category || t.category === tacticSource),
    );
  }, [room?.mapId, tacticSide, tacticSource]);

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

  const tacticVotes = room?.tacticVotes || {};
  const myVote = useMemo(() => {
    const entry = Object.entries(tacticVotes).find(([, voters]) =>
      (voters || []).includes(user?.uid),
    );
    return entry ? entry[0] : null;
  }, [tacticVotes, user?.uid]);
  const displayMyVote = optimisticVote || myVote;

  const assignmentsByPlayer = useMemo(() => {
    if (!room) return [];
    const playersById = Object.fromEntries(
      players.map((p) => [p.uid, p]),
    );
    const grouped = {};
    Object.entries(room.grenadeSelections || {}).forEach(
      ([grenadeId, uid]) => {
        const lineup = lineupsById[Number(grenadeId)];
        if (!lineup) return;
        if (!grouped[uid]) grouped[uid] = [];
        grouped[uid].push(lineup);
      },
    );

    return Object.entries(grouped).map(([uid, lineups]) => ({
      player: playersById[uid] || { uid, username: `Player-${uid.slice(-4)}` },
      lineups,
    }));
  }, [room?.grenadeSelections, players, lineupsById]);

  useEffect(() => {
    if (!room) {
      setTimerRemaining(0);
      return;
    }

    if (room.timerPaused && room.pausedRemainingMs) {
      setTimerRemaining(Math.ceil(room.pausedRemainingMs / 1000));
      return;
    }

    if (!room.timerEnd) {
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
  }, [room?.timerEnd, room?.phase, room?.timerPaused, room?.pausedRemainingMs]);

  const getImageUri = (imageSource) => {
    if (!imageSource) return null;
    if (typeof imageSource === 'string') return imageSource;
    try {
      const asset = Asset.fromModule(imageSource);
      return asset.localUri || asset.uri;
    } catch (err) {
      return null;
    }
  };

  const handleImagePress = (imageSource) => {
    const uri = getImageUri(imageSource);
    if (!uri) return;
    setViewerImages([{ uri }]);
    setImageViewerVisible(true);
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code.length === 6) {
      joinRoom(code);
    }
  };

  const renderError = () =>
    error ? (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={clearError}>
          <Text style={styles.errorDismiss}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const renderRoomHeader = (showPhase = true, extraAction = null) => (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.heading}>Room {room?.code}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={leaveRoom}>
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
          {extraAction}
        </View>
      </View>
      {showPhase ? (
        <Text style={styles.subheading}>
          Phase: {normalizedPhase.split('_').join(' ')}
          {map ? ' - ' + map.name : ''}
        </Text>
      ) : null}
      <View style={styles.playerRow}>
        {players.map((player) => {
          const avatar =
            player.avatar || player.profilePicture || player.photoURL || null;
          const isLeader = room?.iglId === player.uid;
          return (
            <View
              key={player.uid}
              style={[styles.playerAvatar, isLeader && styles.playerAvatarIGL]}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.playerAvatarText}>
                  {player.username?.[0]?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderPlayerChip = (player) => {
    const isLeader = room?.iglId === player.uid;
    return (
      <View key={player.uid} style={styles.playerChip}>
        <Text style={styles.playerChipText}>
          {player.username}{isLeader ? ' (IGL)' : ''}
        </Text>
      </View>
    );
  };

  const renderMapCard = (mapOption) => {
    const isSelected = room?.mapId === mapOption.id;
    const disabled = !isIGL;
    return (
      <TouchableOpacity
        key={mapOption.id}
        style={[
          styles.mapCard,
          isSelected && styles.mapCardSelected,
          disabled && styles.disabledCard,
        ]}
        onPress={() => isIGL && setMap(mapOption.id)}
        disabled={disabled}
      >
        <Text style={styles.mapName}>{mapOption.name}</Text>
        <Text style={styles.mapStatus}>{mapOption.isLocked ? 'Locked' : 'Active'}</Text>
      </TouchableOpacity>
    );
  };

  const renderTacticCard = (tactic) => {
    const votes = tacticVotes[tactic.id] || [];
    const isMyVote = displayMyVote === tactic.id;
    const isIGLPick = pendingTacticId === tactic.id;
    return (
      <TouchableOpacity
        key={tactic.id}
        style={[
          styles.tacticCard,
          isMyVote && styles.tacticVoted,
          isIGLPick && styles.tacticActive,
          !isIGL && styles.touchableCard,
        ]}
        activeOpacity={0.9}
        onPress={() => {
          setOptimisticVote(tactic.id);
          voteForTactic(tactic.id);
          if (isIGL) {
            setPendingTacticId(tactic.id);
          }
        }}
      >
        <View style={styles.voteBadge}>
          <Text style={styles.voteBadgeText}>{votes.length}</Text>
        </View>
        <Text style={styles.tacticTitle}>{tactic.title}</Text>
        <Text style={styles.tacticDescription}>{tactic.description}</Text>
        <Text style={styles.tacticMeta}>
          {tactic.lineupIds.length} grenades - {tactic.side} - {tactic.category}
        </Text>
        {isIGLPick ? (
          <Text style={styles.iglChoice}>IGL choice</Text>
        ) : null}
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
        disabled={takenByOther || normalizedPhase !== PHASES.THROW_DRAFT}
        onPress={() => selectGrenade(lineup.id)}
      >
        <Text style={styles.grenadeTitle}>{lineup.title}</Text>
        <Text style={styles.grenadeMeta}>
          {lineup.nadeType} - {lineup.site} - {lineup.side}
        </Text>
        <Text style={styles.grenadeMeta}>#{lineup.id}</Text>
      </TouchableOpacity>
    );
  };

  const renderExecutionLine = (lineup, ownerName) => (
    <View key={lineup.id} style={styles.executionCard}>
      <Text style={styles.grenadeTitle}>
        {lineup.title} <Text style={styles.executionOwner}>({ownerName})</Text>
      </Text>
      <Text style={styles.grenadeMeta}>
        Stand and aim positions below. Throw type: {lineup.throwType}
      </Text>
      <View style={styles.executionImages}>
        <TouchableOpacity
          onPress={() => handleImagePress(lineup.standImage)}
          activeOpacity={0.9}
          style={styles.executionImageWrapper}
        >
          <Image source={lineup.standImage} style={styles.executionImage} />
          <Text style={styles.executionImageLabel}>Stand</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleImagePress(lineup.aimImage)}
          activeOpacity={0.9}
          style={styles.executionImageWrapper}
        >
          <Image source={lineup.aimImage} style={styles.executionImage} />
          <Text style={styles.executionImageLabel}>Aim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLanding = () => (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.landingContainer}
    >
      <Text style={styles.heading}>Tactics Room</Text>
      <Text style={styles.subheading}>
        Create a room as the IGL or join using a 6-digit code.
      </Text>

      {renderError()}

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

  const renderMapSelect = () => (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContainer}>
      {renderRoomHeader()}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pick the map</Text>
        {isIGL ? (
          <View style={styles.mapGrid}>{MAPS.map(renderMapCard)}</View>
        ) : (
          <View style={styles.mapGrid}>
            {map ? (
              renderMapCard(map)
            ) : (
              <Text style={styles.subheading}>Waiting for IGL to select a map</Text>
            )}
          </View>
        )}
        {isIGL ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!room?.mapId || loading) && styles.disabled,
            ]}
            disabled={!room?.mapId || loading}
            onPress={goToPrepPhase}
          >
            <Text style={styles.buttonText}>Continue to lobby</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.subheading}>
            {map ? 'Map selected by IGL' : 'Waiting for IGL to select a map'}
          </Text>
        )}
      </View>
      {renderError()}
    </ScrollView>
  );

  const renderPrepLobby = () => (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContainer}>
      {renderRoomHeader()}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Players</Text>
          {isIGL ? (
            <TouchableOpacity onPress={returnToMapSelect}>
              <Text style={styles.secondaryText}>Change map</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.playerList}>{players.map(renderPlayerChip)}</View>
      </View>
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Ready up</Text>
          <Text style={styles.subheading}>{map ? map.name : 'No map set'}</Text>
        </View>
        {isIGL ? (
          <TouchableOpacity
            style={[styles.primaryButton, !map && styles.disabled]}
            disabled={!map || loading}
            onPress={startMatch}
          >
            <Text style={styles.buttonText}>Start match</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.subheading}>Waiting for IGL to start match</Text>
        )}
      </View>
      {renderError()}
    </ScrollView>
  );

  const renderTacticVote = () => (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContainer}>
      {renderRoomHeader()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Side & tactics</Text>
        <View style={styles.toggleRow}>
          {['T', 'CT'].map((side) => (
            <TouchableOpacity
              key={side}
              style={[
                styles.togglePill,
                tacticSide === side && styles.togglePillActive,
                !isIGL && styles.disabledCard,
              ]}
              disabled={!isIGL}
              onPress={() => setSide(side)}
            >
              <Text
                style={[
                  styles.toggleText,
                  tacticSide === side && styles.toggleTextActive,
                ]}
              >
                {side} side
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.toggleRow}>
          {['default', 'personal'].map((source) => (
            <TouchableOpacity
              key={source}
              style={[
                styles.togglePill,
                tacticSource === source && styles.togglePillActive,
                !isIGL && styles.disabledCard,
              ]}
              disabled={!isIGL}
              onPress={() => setTacticSource(source)}
            >
              <Text
                style={[
                  styles.toggleText,
                  tacticSource === source && styles.toggleTextActive,
                ]}
              >
                {source === 'default' ? 'Default' : 'Personal'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vote a tactic</Text>
        {filteredTactics.length ? (
          filteredTactics.map(renderTacticCard)
        ) : (
          <Text style={styles.emptyText}>
            No tactics for this map/side yet.
          </Text>
        )}
        {isIGL ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!pendingTacticId || loading) && styles.disabled,
              { marginTop: 16 },
            ]}
            onPress={() => startGrenadeDraft(pendingTacticId, room.mapId)}
            disabled={!pendingTacticId || loading}
          >
            <Text style={styles.buttonText}>Start game</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.subheading}>IGL will make the final pick</Text>
        )}
      </View>
      {renderError()}
    </ScrollView>
  );

  const renderDraft = () => (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContainer}>
      {renderRoomHeader()}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Grenade draft</Text>
            <Text style={styles.subheading}>
              {activeTactic?.title || 'Pick a tactic'} - {timerRemaining || 0}s
              {room?.timerPaused ? ' (paused)' : ''}
            </Text>
          </View>
          {isIGL ? (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={toggleTimerPause}
              >
                <Text style={styles.smallButtonText}>
                  {room?.timerPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, { marginLeft: 8 }]}
                onPress={skipToExecution}
              >
                <Text style={styles.smallButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        <View style={styles.grenadeGrid}>
          {selectionLineups.map(renderGrenadeCard)}
        </View>
        {selectionLineups.length === 0 ? (
          lineupsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF6800" />
              <Text style={styles.loadingText}>Loading lineups...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Waiting for the IGL to pick a tactic.
            </Text>
          )
        ) : null}
      </View>
      {renderError()}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#FF6800" />
      ) : null}
    </ScrollView>
  );

  const renderExecution = () => (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContainer}>
      {renderRoomHeader(
        false,
        isIGL ? (
          <TouchableOpacity style={styles.endRoundTopButton} onPress={endRound}>
            <Text style={styles.endRoundTopText}>End round</Text>
          </TouchableOpacity>
        ) : null,
      )}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>
              Executing: {activeTactic?.title || 'Tactic'}
            </Text>
            <Text style={styles.subheading}>
              Side {room?.side || 'T'} - {map ? map.name : 'No map'}
            </Text>
          </View>
        </View>
      </View>

      {assignmentsByPlayer.length ? (
        assignmentsByPlayer.map(({ player, lineups }) =>
          lineups.map((lineup) => renderExecutionLine(lineup, player.username)),
        )
      ) : (
        <View style={styles.section}>
          <Text style={styles.emptyText}>
            No grenades were claimed. Returning to tactic vote after IGL ends the round.
          </Text>
        </View>
      )}
      {renderError()}
    </ScrollView>
  );

  if (roomCode && !room) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FF6800" size="large" />
        <Text style={styles.loadingText}>Connecting to tactics room...</Text>
      </View>
    );
  }

  if (!roomCode || !room) {
    return renderLanding();
  }

  let content = renderMapSelect();
  if (normalizedPhase === PHASES.PREP) {
    content = renderPrepLobby();
  } else if (normalizedPhase === PHASES.TACTIC_VOTE) {
    content = renderTacticVote();
  } else if (normalizedPhase === PHASES.THROW_DRAFT) {
    content = renderDraft();
  } else if (normalizedPhase === PHASES.EXECUTION) {
    content = renderExecution();
  }

  return (
    <>
      {content}
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
  landingContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    paddingTop: 80,
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
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  playerAvatarIGL: {
    borderWidth: 2,
    borderColor: '#ffcc00',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  playerAvatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  playerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  playerChip: {
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  playerChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mapCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1c1c1c',
    width: '47%',
    marginBottom: 12,
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
    padding: 14,
    paddingRight: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#1a1a1a',
    marginBottom: 12,
  },
  tacticVoted: {
    borderColor: '#5E98D9',
    backgroundColor: '#0f1a28',
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
  iglChoice: {
    color: '#FF6800',
    marginTop: 6,
    fontWeight: '600',
  },
  voteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6800',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  voteBadgeText: {
    color: '#0a0a0a',
    fontWeight: '700',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  togglePill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    marginRight: 8,
  },
  togglePillActive: {
    borderColor: '#FF6800',
    backgroundColor: '#1e1308',
  },
  toggleText: {
    color: '#bbb',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
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
  executionOwner: {
    color: '#888',
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333',
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  endRoundTopButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6800',
  },
  endRoundTopText: {
    color: '#FF6800',
    fontWeight: '700',
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
  leaveText: {
    color: '#f65f5f',
    fontWeight: '600',
  },
  emptyText: {
    color: '#777',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  touchableCard: {
    opacity: 0.95,
  },
});


