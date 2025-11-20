import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LINEUPS } from '../data/lineups';

// Separate component for LineupCard to properly use hooks
function LineupCard({ item, navigation }) {
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

export default function LineupGridScreen({ navigation, route }) {
  const { map } = route.params;
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Applied filter states (arrays for multi-select)
  const [selectedSides, setSelectedSides] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedNadeTypes, setSelectedNadeTypes] = useState([]);

  // Temporary filter states (for the panel before applying)
  const [tempSides, setTempSides] = useState([]);
  const [tempSites, setTempSites] = useState([]);
  const [tempNadeTypes, setTempNadeTypes] = useState([]);

  // Get lineups for this map
  const mapLineups = LINEUPS.filter(lineup => lineup.mapId === map.id);

  // Apply filters and search
  const filteredLineups = mapLineups.filter(lineup => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lineup.title.toLowerCase().includes(query) ||
        lineup.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Multi-select filters
    if (selectedSides.length > 0 && !selectedSides.includes(lineup.side)) return false;
    if (selectedSites.length > 0 && !selectedSites.includes(lineup.site)) return false;
    if (selectedNadeTypes.length > 0 && !selectedNadeTypes.includes(lineup.nadeType)) return false;
    return true;
  }).sort((a, b) => b.uploadedAt - a.uploadedAt); // Sort by most recent

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
    <LineupCard item={item} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
          <Ionicons name="funnel-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
  
      {/* Lineup Grid */}
      <FlatList
        data={filteredLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 5,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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