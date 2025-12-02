import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS } from '../data/maps';
import { getFilteredLineups } from '../services/lineupService';
import { fetchPublicTactics, fetchUserTactics } from '../services/tacticService';
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
  const [publicTactics, setPublicTactics] = useState([]);
  const [myTacticsRemote, setMyTacticsRemote] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const { savedTactics, toggleTactic, isSaved } = useTacticLibrary();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (route?.params?.startTab && (route.params.startTab === 'explore' || route.params.startTab === 'my')) {
      setActiveTab(route.params.startTab);
    }
  }, [route?.params?.startTab]);

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
    if (route?.params?.refresh) {
      loadTactics();
    }
  }, [route?.params?.refresh, loadTactics]);

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
      const tacticLineupIds = tactic.lineupIds || tactic.linupIds || [];
      const resolvedLineups = tacticLineupIds
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
        lineupIds: tacticLineupIds,
        lineups: fallbackLineups,
        lineupCount: resolvedLineups.length || tacticLineupIds.length || fallbackLineups.length,
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

  const handleCreateFromFavorites = () => {
    if (!selectedMapId) {
      setActionMessage('Pick a map first.');
      return;
    }
    if (!currentUser?.uid) {
      setActionMessage('Sign in to create tactics.');
      return;
    }
    navigation.navigate('CreateTacticFromFavorites', {
      mapId: selectedMapId,
      side: selectedSide,
      map: selectedMap,
    });
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
      >
        <Ionicons name="add-circle-outline" size={20} color="#1a1a1a" />
        <Text style={styles.actionButtonText}>
          Create tactic from favorites
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
      <View style={styles.topHeader}>
        <View style={styles.tabContainer}>
          {['explore', 'my'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.headerTab, activeTab === tab && styles.headerTabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.headerTabText,
                  activeTab === tab && styles.headerTabTextActive,
                ]}
              >
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
  topHeader: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  headerTab: {
    paddingVertical: 6,
  },
  headerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6800',
  },
  headerTabText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#888',
  },
  headerTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sideToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 12,
    paddingBottom: 10,
    marginTop: 12,
  },
  sideToggle: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
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
