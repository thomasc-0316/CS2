import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUpvotes } from '../context/UpvoteContext';
import LineupCard from '../components/LineupCard';

export default function HotScreen({ navigation }) {
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'week', 'month'
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allLineups, setAllLineups] = useState([]);
  const { getUpvoteCount } = useUpvotes();

  useEffect(() => {
    fetchLineups();
  }, []);

  const fetchLineups = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'lineups'),
        where('isPublic', '==', true),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const lineups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllLineups(lineups);
    } catch (error) {
      console.error('Error fetching lineups:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Index required! Click the link in the error to create it.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLineups = () => {
    let lineups = [...allLineups];
    const now = new Date();

    const withinWindow = (uploadedAt, msWindow) => {
      const date = uploadedAt?.toDate ? uploadedAt.toDate() : new Date(uploadedAt);
      return date >= new Date(now.getTime() - msWindow);
    };

    if (timeFilter === 'today') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 24 * 60 * 60 * 1000));
    } else if (timeFilter === 'week') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 7 * 24 * 60 * 60 * 1000));
    } else if (timeFilter === 'month') {
      lineups = lineups.filter((l) => withinWindow(l.uploadedAt, 30 * 24 * 60 * 60 * 1000));
    }

    // Sort by likes (upvotes) desc; tie-breaker: newest first
    return lineups.sort((a, b) => {
      const aLikes = getUpvoteCount(a);
      const bLikes = getUpvoteCount(b);
      if (bLikes !== aLikes) return bLikes - aLikes;
      const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
      const bDate = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
      return bDate - aDate;
    });
  };

  const hotLineups = getFilteredLineups();

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLineups();
    setRefreshing(false);
  };

  const getRankBadgeColor = (index) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return null;
  };

  const renderLineupCard = ({ item, index }) => {
    const rankColor = getRankBadgeColor(index);
    if (rankColor) {
      return <LineupCard lineup={item} navigation={navigation} rankBadge={{ color: rankColor, rank: index + 1 }} />;
    }
    return <LineupCard lineup={item} navigation={navigation} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6800" />
        <Text style={styles.loadingText}>Loading lineups...</Text>
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

      <FlatList
        data={hotLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
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
