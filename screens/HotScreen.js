import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from '../services/firestoreClient';
import { db } from '../firebaseConfig';
import { useUpvotes } from '../context/UpvoteContext';
import LineupCard from '../components/LineupCard';
import LineupGridSkeleton from '../components/LineupGridSkeleton';
import MasonryList from '@react-native-seoul/masonry-list';
import { useRenderCount } from '../hooks/useRenderCount';
import { useScreenPerf } from '../hooks/useScreenPerf';
import {
  fetchDeduped,
  readMemoryCache,
  readPersistentCache,
  writeMemoryCache,
  writePersistentCache,
} from '../services/dataCache';
import { toEpochMs } from '../services/timeUtils';

export default function HotScreen({ navigation }) {
  const cacheKey = 'hot-lineups';
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'week', 'month'
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allLineups, setAllLineups] = useState([]);
  const { getUpvoteCount } = useUpvotes();
  useRenderCount('HotScreen');

  useScreenPerf({
    screenName: 'HotScreen',
    transitionName: 'home_to_hot_tab',
    hasFirstContent: true,
    isDataReady: !loading,
  });

  const fetchLineups = useCallback(async ({ forceRefresh = false } = {}) => {
    const ttlMs = 60 * 1000;
    let hasCachedData = false;
    if (!forceRefresh) {
      const memory = readMemoryCache(cacheKey);
      if (memory.exists) {
        setAllLineups(memory.value);
        setLoading(false);
        hasCachedData = true;
        if (!memory.isExpired) {
          return;
        }
      } else {
        const persisted = await readPersistentCache(cacheKey);
        if (persisted.exists) {
          setAllLineups(persisted.value);
          writeMemoryCache(cacheKey, persisted.value, ttlMs);
          setLoading(false);
          hasCachedData = true;
          if (!persisted.isExpired) {
            return;
          }
        }
      }
    }

    try {
      setLoading(!hasCachedData && !forceRefresh);
      const lineups = await fetchDeduped(cacheKey, async () => {
        const q = query(
          collection(db, 'lineups'),
          where('isPublic', '==', true),
          orderBy('uploadedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      });
      setAllLineups(lineups);
      writeMemoryCache(cacheKey, lineups, ttlMs);
      writePersistentCache(cacheKey, lineups, ttlMs);
    } catch (error) {
      console.error('Error fetching lineups:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Index required! Click the link in the error to create it.');
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchLineups({ forceRefresh: false });
  }, [fetchLineups]);

  const hotLineups = useMemo(() => {
    let lineups = [...allLineups];
    const now = Date.now();

    const withinWindow = (uploadedAt, msWindow) => {
      return toEpochMs(uploadedAt) >= now - msWindow;
    };

    if (timeFilter === 'today') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 24 * 60 * 60 * 1000));
    } else if (timeFilter === 'week') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 7 * 24 * 60 * 60 * 1000));
    } else if (timeFilter === 'month') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 30 * 24 * 60 * 60 * 1000));
    }

    // Sort by likes (upvotes) desc; tie-breaker: newest first
    return lineups.sort((left, right) => {
      const leftLikes = getUpvoteCount(left);
      const rightLikes = getUpvoteCount(right);
      if (rightLikes !== leftLikes) return rightLikes - leftLikes;
      return toEpochMs(right.uploadedAt) - toEpochMs(left.uploadedAt);
    });
  }, [allLineups, getUpvoteCount, timeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLineups({ forceRefresh: true });
    setRefreshing(false);
  };

  const getRankBadgeColor = (index) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return null;
  };

  const renderLineupCard = useCallback(({ item, index }) => {
    const rankColor = getRankBadgeColor(index);
    if (rankColor) {
      return <LineupCard lineup={item} navigation={navigation} rankBadge={{ color: rankColor, rank: index + 1 }} />;
    }
    return <LineupCard lineup={item} navigation={navigation} />;
  }, [navigation]);

  if (loading && allLineups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LineupGridSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeFilterContainer}>
        {['today', 'week', 'month'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.timeFilterTab, timeFilter === filter && styles.timeFilterTabActive]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[styles.timeFilterText, timeFilter === filter && styles.timeFilterTextActive]}>
              {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <MasonryList
        data={hotLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6800" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flame-outline" size={60} color="#4a4a4a" />
            <Text style={styles.emptyText}>
              {timeFilter === 'today'
                ? 'No lineups posted in most recent 24 hours'
                : timeFilter === 'week'
                  ? 'No lineups posted in most recent 7 days'
                  : 'No lineups posted in most recent 30 days'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#888',
    marginTop: 15,
    fontSize: 16,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  timeFilterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  timeFilterTabActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  timeFilterText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  timeFilterTextActive: {
    color: '#fff',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
});
