import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LINEUPS } from '../data/lineups';
import { MAPS } from '../data/maps';
import { useUpvotes } from '../context/UpvoteContext';

export default function HotScreen() {
  const navigation = useNavigation();
  const { getUpvoteCount } = useUpvotes();
  const [timeFilter, setTimeFilter] = useState('all'); // 'week', 'month', 'all'

  // Filter lineups by time
  const getFilteredLineups = () => {
    const now = new Date();
    let filteredLineups = LINEUPS;

    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLineups = LINEUPS.filter(lineup => lineup.uploadedAt >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLineups = LINEUPS.filter(lineup => lineup.uploadedAt >= monthAgo);
    }

    // Sort by upvotes (highest first) - using live upvote counts
    return filteredLineups.sort((a, b) => getUpvoteCount(b) - getUpvoteCount(a));
  };

  const hotLineups = getFilteredLineups();

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const renderLineupCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineup: item })}
    >
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>

      <Image source={{ uri: item.standImage }} style={styles.cardImage} />
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.mapName}>{getMapName(item.mapId)}</Text>
        
        <View style={styles.tags}>
          <Text style={styles.tag}>{item.side}</Text>
          <Text style={styles.tag}>{item.site}</Text>
          <Text style={styles.tag}>{item.nadeType}</Text>
        </View>

        {/* Upvote Count - now using live counts */}
        <View style={styles.upvoteContainer}>
          <Text style={styles.fireIcon}>🔥</Text>
          <Text style={styles.upvoteText}>{getUpvoteCount(item)} upvotes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Time Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[styles.filterButtonText, timeFilter === 'week' && styles.filterButtonTextActive]}>
            Past Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[styles.filterButtonText, timeFilter === 'month' && styles.filterButtonTextActive]}>
            Past Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.filterButtonText, timeFilter === 'all' && styles.filterButtonTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hot Lineups Grid */}
      <FlatList
        data={hotLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  filterButtonActive: {
    backgroundColor: '#FF6800',
  },
  filterButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 5,
  },
  lineupCard: {
    width: '47%',
    margin: 5,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    zIndex: 10,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#3a3a3a',
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  mapName: {
    fontSize: 12,
    color: '#FF6800',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  upvoteText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
});