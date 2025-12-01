import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS } from '../data/maps';
import { getFilteredLineups } from '../services/lineupService';
import { fetchPublicTactics, fetchUserTactics, createTactic } from '../services/tacticService';
import { useFavorites } from '../context/FavoritesContext';
import { useTacticLibrary } from '../context/TacticLibraryContext';
import { useAuth } from '../context/AuthContext';
import TacticCard from '../components/TacticCard';

export default function TacticsHubScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('explore'); // explore | my
  const initialMapId =
    route?.params?.map?.id ||
    route?.params?.mapId ||
    MAPS[0]?.id ||
    null;
  const [selectedMapId, setSelectedMapId] = useState(initialMapId);
  const [selectedSide, setSelectedSide] = useState('T');
  const [mapLineups, setMapLineups] = useState([]);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [loadingTactics, setLoadingTactics] = useState(false);
  const [creatingTactic, setCreatingTactic] = useState(false);
  const [publicTactics, setPublicTactics] = useState([]);
  const [myTacticsRemote, setMyTacticsRemote] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const { getFavorites } = useFavorites();
  const { savedTactics, toggleTactic, isSaved, saveTactic } = useTacticLibrary();
  const { currentUser } = useAuth();

  useEffect(() => {
    const nextMapId =
      route?.params?.map?.id ||
      route?.params?.mapId ||
      null;
    if (nextMapId && nextMapId !== selectedMapId) {
      setSelectedMapId(nextMapId);
    }
  }, [route?.params?.map?.id, route?.params?.mapId]);

  const selectedMap = useMemo(
    () => MAPS.find((item) => item.id === selectedMapId) || null,
    [selectedMapId],
  );

  useEffect(() => {
    if (!selectedMapId) return undefined;
    let cancelled = false;
    const fetchLineups = async () => {
      try {
        setLoadingLineups(true);
        const lineups = await getFilteredLineups(selectedMapId, { side: selectedSide });
        if (!cancelled) {
          setMapLineups(lineups || []);
        }
      } catch (error) {
        console.error('Failed to load lineups for tactics', error);
      } finally {
        if (!cancelled) {
          setLoadingLineups(false);
        }
      }
    };

    fetchLineups();
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, selectedSide]);

  const loadTactics = useCallback(async () => {
    if (!selectedMapId) {
      setPublicTactics([]);
      setMyTacticsRemote([]);
      return;
    }

    try {
      setLoadingTactics(true);
      const [publicList, personalList] = await Promise.all([
        fetchPublicTactics(selectedMapId, selectedSide),
        currentUser?.uid
          ? fetchUserTactics(currentUser.uid, selectedMapId, selectedSide)
          : Promise.resolve([]),
      ]);
      setPublicTactics(publicList || []);
      setMyTacticsRemote(personalList || []);
    } catch (error) {
      console.error('Failed to load tactics', error);
    } finally {
      setLoadingTactics(false);
    }
  }, [currentUser?.uid, selectedMapId, selectedSide]);

  useEffect(() => {
    loadTactics();
  }, [loadTactics]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timeout = setTimeout(() => setActionMessage(''), 2400);
    return () => clearTimeout(timeout);
  }, [actionMessage]);

  const lineupsById = useMemo(() => {
    if (!selectedMapId) return {};
    return mapLineups.reduce((acc, lineup) => {
      acc[lineup.id] = lineup;
      acc[String(lineup.id)] = lineup;
      return acc;
    }, {});
  }, [mapLineups]);

  const hydrateTactic = useCallback(
    (tactic) => {
      const resolvedLineups = (tactic.lineupIds || [])
        .map((id) => lineupsById[id] || lineupsById[String(id)] || lineupsById[Number(id)])
        .filter(Boolean);
      const fallbackLineups =
        resolvedLineups.length > 0
          ? resolvedLineups
          : mapLineups.filter(
              (lineup) => (lineup.side || '').toUpperCase() === (tactic.side || selectedSide).toUpperCase(),
            );

      const tags = new Set(tactic.tags || []);
      if (tactic.isTextbook) tags.add('textbook');
      if (tactic.creatorId && tactic.creatorId === currentUser?.uid) tags.add('mine');

      return {
        ...tactic,
        side: (tactic.side || selectedSide).toUpperCase(),
        tags: Array.from(tags),
        lineups: fallbackLineups,
        lineupCount: resolvedLineups.length || tactic.lineupIds?.length || fallbackLineups.length,
      };
    },
    [currentUser?.uid, lineupsById, mapLineups, selectedSide],
  );

  const exploreTactics = useMemo(
    () => (selectedMapId ? publicTactics.map(hydrateTactic) : []),
    [hydrateTactic, publicTactics, selectedMapId],
  );

  const myTacticsForSelection = useMemo(() => {
    if (!selectedMapId) return [];
    const targetSide = selectedSide.toUpperCase();
    const savedOnMap = (savedTactics || []).filter(
      (tactic) =>
        tactic.mapId === selectedMapId &&
        (tactic.side || '').toUpperCase() === targetSide,
    );

    const createdOnMap = (myTacticsRemote || []).filter(
      (tactic) =>
        tactic.mapId === selectedMapId &&
        (tactic.side || '').toUpperCase() === targetSide,
    );

    const merged = new Map();
    [...createdOnMap, ...savedOnMap].forEach((tactic) => {
      const hydrated = hydrateTactic(tactic);
      merged.set(hydrated.id, hydrated);
    });

    return Array.from(merged.values());
  }, [hydrateTactic, myTacticsRemote, savedTactics, selectedMapId, selectedSide]);

  const handleLineupPress = (lineup) => {
    navigation.navigate('LineupDetail', { lineupId: lineup.id });
  };

  const handleSaveToggle = (tactic) => {
    const payload = {
      ...tactic,
      mapId: tactic.mapId || selectedMapId,
      side: (tactic.side || selectedSide).toUpperCase(),
      lineupIds: tactic.lineupIds?.length ? tactic.lineupIds : (tactic.lineups || []).map((l) => l.id),
    };
    const wasSaved = isSaved(payload.id);
    toggleTactic(payload);
    setActionMessage(wasSaved ? 'Removed from My Tactics' : 'Saved to My Tactics');
  };

  const handleCreateFromFavorites = async () => {
    if (!selectedMapId) {
      setActionMessage('Pick a map first.');
      return;
    }
    if (!currentUser?.uid) {
      setActionMessage('Sign in to create tactics.');
      return;
    }
    const favoriteIds = getFavorites();
    const favoritesOnMap = mapLineups.filter((lineup) => favoriteIds.includes(lineup.id));
    if (!favoritesOnMap.length) {
      setActionMessage('No favorites on this map/side yet.');
      return;
    }

    try {
      setCreatingTactic(true);
      const created = await createTactic({
        mapId: selectedMapId,
        side: selectedSide,
        title: `${selectedMap?.name || selectedMapId} favorites`,
        description: 'Built from your own posted or favorited lineups.',
        lineupIds: favoritesOnMap.map((item) => item.id),
        tags: ['custom', 'favorites'],
        creatorId: currentUser.uid,
        creatorUsername:
          currentUser.profile?.username ||
          currentUser.displayName ||
          currentUser.email ||
          'Player',
        creatorPlayerId: currentUser.profile?.playerID || null,
        isTextbook: false,
        isPublic: true,
      });
      // Keep local "saved" copy for offline recall
      saveTactic({
        ...created,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await loadTactics();
      setActiveTab('my');
      setActionMessage('Created tactic from favorites');
    } catch (error) {
      console.error('Failed to create tactic from favorites', error);
      setActionMessage('Could not create tactic. Try again.');
    } finally {
      setCreatingTactic(false);
    }
  };

  const renderTacticCard = ({ item }) => (
    <TacticCard
      tactic={item}
      map={selectedMap}
      saved={isSaved(item.id)}
      onSave={() => handleSaveToggle(item)}
      onLineupPress={handleLineupPress}
      onPress={() =>
        navigation.navigate('TacticDetail', {
          tactic: item,
          lineups: item.lineups,
          map: selectedMap,
        })
      }
    />
  );

  const renderExplore = () => (
    <View style={{ flex: 1 }}>
      {loadingLineups || loadingTactics ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#FF6800" />
          <Text style={styles.loadingText}>Loading tactics...</Text>
        </View>
      ) : (
        <FlatList
          data={exploreTactics}
          renderItem={renderTacticCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={46} color="#555" />
              <Text style={styles.emptyTitle}>No tactics yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your own from favorites or start building from room calls.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  const renderMyTactics = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleCreateFromFavorites}
        activeOpacity={0.9}
        disabled={creatingTactic}
      >
        <Ionicons name="add-circle-outline" size={20} color="#1a1a1a" />
        <Text style={styles.actionButtonText}>
          {creatingTactic ? 'Creating tactic...' : 'Create tactic from favorites'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={myTacticsForSelection}
        renderItem={renderTacticCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={46} color="#555" />
            <Text style={styles.emptyTitle}>No saved tactics yet</Text>
            <Text style={styles.emptySubtitle}>
              Save a tactic from Explore or bundle your own favorites to get started.
            </Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabSwitchWrapper}>
        <View style={styles.tabSwitch}>
          {['explore', 'my'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'explore' ? 'Explore' : 'My tactics'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sideToggleRow}>
        {['T', 'CT'].map((side) => {
          const isActive = selectedSide === side;
          return (
            <TouchableOpacity
              key={side}
              style={[styles.sideToggle, isActive && styles.sideToggleActive]}
              onPress={() => setSelectedSide(side)}
            >
              <Text style={[styles.sideToggleText, isActive && styles.sideToggleTextActive]}>
                {side === 'T' ? 'T side' : 'CT side'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {actionMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{actionMessage}</Text>
        </View>
      ) : null}

      {activeTab === 'explore' ? renderExplore() : renderMyTactics()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 0,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: '#FF6800',
  },
  tabText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#1a1a1a',
  },
  tabSwitchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: 'flex-end',
  },
  sideToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 10,
  },
  sideToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#2f2f2f',
    alignItems: 'center',
  },
  sideToggleActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  sideToggleText: {
    color: '#888',
    fontWeight: '700',
  },
  sideToggleTextActive: {
    color: '#1a1a1a',
  },
  toast: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#888',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#888',
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6800',
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#1a1a1a',
    fontWeight: '800',
    fontSize: 14,
  },
});
