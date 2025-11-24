import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform, Animated, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LINEUPS } from '../data/lineups';
import { MAPS } from '../data/maps';
import { useFollow } from '../context/FollowContext';
import { useUpvotes } from '../context/UpvoteContext';

// Lineup Card Component
function LineupCard({ item, navigation, getMapName }) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineupId: item.id })}
    >
      <Image
        source={typeof item.landImage === 'string' ? { uri: item.landImage } : item.landImage}
        style={styles.cardImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => setImageLoading(true)}
        onLoad={() => setImageLoading(false)}
      />

      {imageLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}

      {item.isTextbook && (
        <View style={styles.textbookBadge}>
          <Ionicons name="book" size={16} color="#fff" />
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.mapName}>{getMapName(item.mapId)}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>{item.side}</Text>
          <Text style={styles.tag}>{item.site}</Text>
          <Text style={styles.tag}>{item.nadeType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MapSelectionScreen({ navigation }) {
  const [category, setCategory] = useState('explore'); // 'explore' or 'following'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [refreshing, setRefreshing] = useState(false);
  const { getFollowing } = useFollow();
  const { getUpvoteCount } = useUpvotes();

  // Applied filter states (arrays for multi-select)
  const [selectedSides, setSelectedSides] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedNadeTypes, setSelectedNadeTypes] = useState([]);

  // Temporary filter states (for the panel before applying)
  const [tempSides, setTempSides] = useState([]);
  const [tempSites, setTempSites] = useState([]);
  const [tempNadeTypes, setTempNadeTypes] = useState([]);

  // Get IDs of users we're following
  const followingUsers = getFollowing();
  const followingUserIds = followingUsers.map(user => user.id);

  // Filter lineups based on category and search
  const getFilteredLineups = () => {
    let lineups = LINEUPS;

    // Filter by category
    if (category === 'following') {
      // Only show lineups from creators we follow
      // For now, we'll check if the lineup has a creatorId field
      // Since lineups don't have creatorId yet, this will be empty
      // We'll need to add creatorId to lineups or use another way to identify creators
      lineups = lineups.filter(lineup =>
        lineup.creatorId && followingUserIds.includes(lineup.creatorId)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      lineups = lineups.filter(lineup =>
        lineup.title.toLowerCase().includes(query) ||
        lineup.description.toLowerCase().includes(query) ||
        lineup.nadeType.toLowerCase().includes(query) ||
        lineup.site.toLowerCase().includes(query) ||
        lineup.side.toLowerCase().includes(query)
      );
    }

    // Apply multi-select filters
    lineups = lineups.filter(lineup => {
      if (selectedSides.length > 0 && !selectedSides.includes(lineup.side)) return false;
      if (selectedSites.length > 0 && !selectedSites.includes(lineup.site)) return false;
      if (selectedNadeTypes.length > 0 && !selectedNadeTypes.includes(lineup.nadeType)) return false;
      return true;
    });

    // Sort by most recent
    return lineups.sort((a, b) => b.uploadedAt - a.uploadedAt);
  };

  const filteredLineups = getFilteredLineups();

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

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

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you'd refetch data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderLineupCard = ({ item }) => (
    <LineupCard item={item} navigation={navigation} getMapName={getMapName} />
  );

  return (
    <View style={styles.container}>
      {/* Header with Category and Search */}
      <View style={styles.header}>
        {/* Menu on Left */}
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              // TODO: Add menu functionality
              console.log('Menu pressed');
            }}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Centered Category Tabs */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setCategory('explore')}
          >
            <Text style={[styles.categoryText, category === 'explore' && styles.categoryTextActive]}>
              Explore
            </Text>
            {category === 'explore' && <View style={styles.categoryUnderline} />}
          </TouchableOpacity>

          <View style={styles.categoryDivider} />

          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setCategory('following')}
          >
            <Text style={[styles.categoryText, category === 'following' && styles.categoryTextActive]}>
              Following
            </Text>
            {category === 'following' && <View style={styles.categoryUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Placeholder for symmetry */}
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar with Filter Button - Always Visible */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search lineups..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
          <Ionicons name="funnel-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Lineup Grid */}
      <FlatList
        data={filteredLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6800"
            colors={['#FF6800']}
            progressBackgroundColor="#3a3a3a"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={category === 'following' ? 'people-outline' : 'search-outline'}
              size={60}
              color="#666"
            />
            <Text style={styles.emptyText}>
              {category === 'following'
                ? 'No lineups from followed creators'
                : searchQuery
                ? 'No lineups found'
                : 'No lineups available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {category === 'following'
                ? 'Follow creators to see their lineups here'
                : searchQuery
                ? 'Try a different search term'
                : 'Check back later for new content'}
            </Text>
          </View>
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
                style={styles.clearButtonFilter}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonTextFilter}>Clear All</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    position: 'relative',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  categoryContainer: {
    position: 'absolute',
    left: '8%',
    right: '5%',
    top: Platform.OS === 'ios' ? 54 : 24,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  categoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '50%',
    backgroundColor: '#FF6800',
  },
  categoryDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#4a4a4a',
    marginHorizontal: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    backgroundColor: '#4a4a4a',
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
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
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#3a3a3a',
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
    color: '#999',
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 165 : 135,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterPanel: {
    position: 'absolute',
    right: 0,
    top: Platform.OS === 'ios' ? 165 : 135,
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
  clearButtonFilter: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonTextFilter: {
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
});