import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import LineupCard from '../components/LineupCard';
import { getFilteredLineups } from '../services/lineupService';
import { MAPS } from '../data/maps';

export default function TacticDetailScreen({ navigation, route }) {
  const tactic = route.params?.tactic;
  const incomingLineups = route.params?.lineups || [];
  const map = route.params?.map || MAPS.find((m) => m.id === tactic?.mapId);

  const [lineups, setLineups] = useState(incomingLineups);
  const [loading, setLoading] = useState(!incomingLineups.length);

  const tacticLineupIds = useMemo(
    () => tactic?.lineupIds || tactic?.linupIds || [],
    [tactic?.lineupIds, tactic?.linupIds],
  );

  const lineupIdSet = useMemo(
    () => new Set(tacticLineupIds.map((id) => String(id))),
    [tacticLineupIds],
  );

  useEffect(() => {
    const load = async () => {
      if (!tactic?.mapId) return;
      try {
        setLoading(true);
        const fetched = await getFilteredLineups(tactic.mapId, { side: tactic.side });
        const filtered = lineupIdSet.size
          ? fetched.filter((l) => lineupIdSet.has(String(l.id)))
          : fetched;
        setLineups(filtered);
      } catch (error) {
        console.error('Failed to load tactic lineups', error);
      } finally {
        setLoading(false);
      }
    };

    if (!incomingLineups.length) {
      load();
    }
  }, [tactic?.mapId, tactic?.side, incomingLineups.length, lineupIdSet]);

  const renderLineup = ({ item }) => (
    <LineupCard lineup={item} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tactic?.title || 'Tactic'}</Text>
        <Text style={styles.meta}>
          {map?.name ? `${map.name} • ` : ''}
          {(tactic?.side || '').toUpperCase()} side
        </Text>
        <Text style={styles.description}>{tactic?.description}</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6800" />
          <Text style={styles.loadingText}>Loading lineups...</Text>
        </View>
      ) : (
        <FlatList
          data={lineups}
          renderItem={renderLineup}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No lineups yet</Text>
              <Text style={styles.emptySubtitle}>
                Add lineups to this tactic to see them here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    color: '#FF6800',
    fontWeight: '700',
    marginTop: 4,
  },
  description: {
    color: '#ccc',
    marginTop: 8,
    lineHeight: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#888',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  empty: {
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
  },
});
