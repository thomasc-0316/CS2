import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import LineupCard from '../components/LineupCard';
import { getFilteredLineups } from '../services/lineupService';
import { MAPS } from '../data/maps';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function TacticDetailScreen({ navigation, route }) {
  const tactic = route.params?.tactic;
  const incomingLineups = route.params?.lineups || [];
  const map = route.params?.map || MAPS.find((m) => m.id === tactic?.mapId);
  const { getUserProfile } = useAuth();

  const [lineups, setLineups] = useState(incomingLineups);
  const [loading, setLoading] = useState(!incomingLineups.length);
  const [creator, setCreator] = useState(null);

  const tacticLineupIds = useMemo(
    () => tactic?.lineupIds || tactic?.linupIds || [],
    [tactic?.lineupIds, tactic?.linupIds],
  );

  const lineupIdSet = useMemo(
    () => new Set(tacticLineupIds.map((id) => String(id))),
    [tacticLineupIds],
  );

  const lookupByUsername = useCallback(async (username) => {
    if (!username) return null;
    try {
      const lower = username.toLowerCase();
      const q = query(
        collection(db, 'users'),
        where('usernameLower', '==', lower),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (error) {
      console.error('Failed to lookup tactic creator by username', error);
    }
    return null;
  }, []);

  useEffect(() => {
    const loadCreator = async () => {
      if (!tactic?.creatorId && !tactic?.creatorUsername) return;
      try {
        const live = tactic?.creatorId ? await getUserProfile(tactic.creatorId) : null;
        const fromUsername = !live && tactic?.creatorUsername
          ? await lookupByUsername(tactic.creatorUsername)
          : null;
        setCreator(live || fromUsername || null);
      } catch (error) {
        console.error('Failed to load tactic creator', error);
      }
    };
    loadCreator();
  }, [getUserProfile, lookupByUsername, tactic?.creatorId, tactic?.creatorUsername]);

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

  const handleCreatorPress = () => {
    if (!creator) return;
    navigation.navigate('UserProfile', {
      userId: creator.id,
      username: creator.username || tactic?.creatorUsername,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tactic?.title || 'Tactic'}</Text>
        <Text style={styles.meta}>
          {map?.name ? `${map.name} • ` : ''}
          {(tactic?.side || '').toUpperCase()} side
        </Text>
        {creator ? (
          <TouchableOpacity style={styles.creatorRow} onPress={handleCreatorPress} activeOpacity={0.8}>
            <Ionicons name="person-circle" size={20} color="#888" />
            <Text style={styles.creatorName} numberOfLines={1}>
              {creator.username || tactic?.creatorUsername || 'Creator'}
            </Text>
            {creator.isVerified ? (
              <Ionicons name="checkmark-circle" size={16} color="#5E98D9" />
            ) : null}
            <Ionicons name="chevron-forward" size={16} color="#555" />
          </TouchableOpacity>
        ) : null}
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
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  creatorName: {
    color: '#fff',
    fontWeight: '700',
    flex: 1,
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
