import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LINEUPS } from '../data/lineups';
import { MAPS } from '../data/maps';
import { useUpvotes } from '../context/UpvoteContext';

// Separate component for LineupCard to properly use hooks
function LineupCard({ item, navigation, rank }) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineup: item })}
    >
      <Image
        source={typeof item.landImage === 'string' ? { uri: item.landImage } : item.landImage}
        style={styles.cardImage}
        onLoadStart={() => setImageLoading(true)}
        onLoad={() => setImageLoading(false)}
      />

      {/* Loading Indicator */}
      {imageLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}

      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {/* Textbook Badge */}
      {item.isTextbook && (
        <View style={styles.textbookBadge}>
          <Ionicons name="book" size={16} color="#fff" />
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>{item.side}</Text>
          <Text style={styles.tag}>{item.site}</Text>
          <Text style={styles.tag}>{item.nadeType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HotScreen() {
  const navigation = useNavigation();
  const { getUpvoteCount } = useUpvotes();
  const [timeFilter, setTimeFilter] = useState('all'); // 'week', 'month', 'all'
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [refreshing, setRefreshing] = useState(false);

  // Applied filter states (arrays for multi-select)
  const [selectedSides, setSelectedSides] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedNadeTypes, setSelectedNadeTypes] = useState([]);

  // Temporary filter states (for the panel before applying)
  const [tempSides, setTempSides] = useState([]);
  const [tempSites, setTempSites] = useState([]);
  const [tempNadeTypes, setTempNadeTypes] = useState([]);

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

    // Apply multi-select filters
    filteredLineups = filteredLineups.filter(lineup => {
      if (selectedSides.length > 0 && !selectedSides.includes(lineup.side)) return false;
      if (selectedSites.length > 0 && !selectedSites.includes(lineup.site)) return false;
      if (selectedNadeTypes.length > 0 && !selectedNadeTypes.includes(lineup.nadeType)) return false;
      return true;
    });

    // Sort by upvotes (highest first) - using live upvote counts
    return filteredLineups.sort((a, b) => getUpvoteCount(b) - getUpvoteCount(a));
  };

  const hotLineups = getFilteredLineups();

  const openFilter = () => {
    // Set temp filters to current applied filters
    setTempSides([...selectedSides]);
    setTempSites([...selectedSites]);
    setTempNadeTypes([...selectedNadeTypes]);
    
    setFilterVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilter = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
  };

  const applyFilters = () => {
    setSelectedSides([...tempSides]);
    setSelectedSites([...tempSites]);
    setSelectedNadeTypes([...tempNadeTypes]);
    closeFilter();
  };

  const clearFilters = () => {
    setTempSides([]);
    setTempSites([]);
    setTempNadeTypes([]);
  };

  const toggleTempSide = (side) => {
    if (tempSides.includes(side)) {
      setTempSides(tempSides.filter(s => s !== side));
    } else {
      setTempSides([...tempSides, side]);
    }
  };

  const toggleTempSite = (site) => {
    if (tempSites.includes(site)) {
      setTempSites(tempSites.filter(s => s !== site));
    } else {
      setTempSites([...tempSites, site]);
    }
  };

  const toggleTempNadeType = (type) => {
    if (tempNadeTypes.includes(type)) {
      setTempNadeTypes(tempNadeTypes.filter(t => t !== type));
    } else {
      setTempNadeTypes([...tempNadeTypes, type]);
    }
  };

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you'd refetch data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Time Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, timeFilter === 'week' && styles.toggleButtonActive]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[styles.toggleText, timeFilter === 'week' && styles.toggleTextActive]}>
            Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, timeFilter === 'month' && styles.toggleButtonActive]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[styles.toggleText, timeFilter === 'month' && styles.toggleTextActive]}>
            Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, timeFilter === 'all' && styles.toggleButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.toggleText, timeFilter === 'all' && styles.toggleTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
        <Ionicons name="funnel-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderLineupCard = ({ item, index }) => (
    <LineupCard item={item} navigation={navigation} rank={index + 1} />
  );

  return (
    <View style={styles.container}>
      {/* Hot Lineups Grid */}
      <FlatList
        data={hotLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6800"
            colors={['#FF6800']}
            progressBackgroundColor="#3a3a3a"
          />
        }
      />

      {/* Filter Panel Overlay */}
      {filterVisible && (
        <>
          {/* Dark overlay - tap to close */}
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeFilter}
          />
          
          {/* Filter Panel */}
          <Animated.View
            style={[
              styles.filterPanel,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <Text style={styles.filterTitle}>Filters</Text>
            
            {/* Side Filter */}
            <Text style={styles.filterLabel}>Side</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, tempSides.includes('T') && styles.filterOptionActive]}
                onPress={() => toggleTempSide('T')}
              >
                <Text style={styles.filterOptionText}>T</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSides.includes('CT') && styles.filterOptionActive]}
                onPress={() => toggleTempSide('CT')}
              >
                <Text style={styles.filterOptionText}>CT</Text>
              </TouchableOpacity>
            </View>

            {/* Site Filter */}
            <Text style={styles.filterLabel}>Site</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, tempSites.includes('A') && styles.filterOptionActive]}
                onPress={() => toggleTempSite('A')}
              >
                <Text style={styles.filterOptionText}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSites.includes('Mid') && styles.filterOptionActive]}
                onPress={() => toggleTempSite('Mid')}
              >
                <Text style={styles.filterOptionText}>Mid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSites.includes('B') && styles.filterOptionActive]}
                onPress={() => toggleTempSite('B')}
              >
                <Text style={styles.filterOptionText}>B</Text>
              </TouchableOpacity>
            </View>

            {/* Nade Type Filter */}
            <Text style={styles.filterLabel}>Nade Type</Text>
            <View style={styles.filterOptions}>
              {['Smoke', 'Nade', 'Molotov', 'Flashbang', 'Decoy'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterOption, tempNadeTypes.includes(type) && styles.filterOptionActive]}
                  onPress={() => toggleTempNadeType(type)}
                >
                  <Text style={styles.filterOptionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    marginBottom: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 15,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6800',
  },
  toggleText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  filterButton: {
    backgroundColor: '#4a4a4a',
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: 5,
    paddingBottom: 5,
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
  cardDescription: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
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
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#2a2a2a',
    padding: 20,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: '#4a4a4a',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  filterOptionActive: {
    backgroundColor: '#5E98D9',
  },
  filterOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4a4a4a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textbookBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#5E98D9',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});