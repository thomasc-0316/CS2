import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import LineupCard from '../components/LineupCard';

export default function LineupGridScreen({ navigation, route }) {
  const { map } = route.params;
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);  // ADD THIS
  const [mapLineups, setMapLineups] = useState([]);  // ADD THIS - Store Firestore lineups

  // Applied filter states (arrays for multi-select)
  const [selectedSides, setSelectedSides] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedNadeTypes, setSelectedNadeTypes] = useState([]);

  // Temporary filter states (for the panel before applying)
  const [tempSides, setTempSides] = useState([]);
  const [tempSites, setTempSites] = useState([]);
  const [tempNadeTypes, setTempNadeTypes] = useState([]);

  // Fetch lineups from Firestore on mount
  useEffect(() => {
    fetchLineups();
  }, [map.id]);

  const fetchLineups = async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'lineups'),
        where('mapId', '==', map.id),
        where('isPublic', '==', true),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const lineups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Images are already URLs from Firebase Storage!
      setMapLineups(lineups);
    } catch (error) {
      console.error('Error fetching lineups:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Index required! Click the link in the error to create it.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  const filteredLineups = mapLineups.filter(lineup => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lineup.title.toLowerCase().includes(query) ||
        lineup.description.toLowerCase().includes(query) ||
        lineup.nadeType.toLowerCase().includes(query) ||
        lineup.site.toLowerCase().includes(query) ||
        lineup.side.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Multi-select filters
    if (selectedSides.length > 0 && !selectedSides.includes(lineup.side)) return false;
    if (selectedSites.length > 0 && !selectedSites.includes(lineup.site)) return false;
    if (selectedNadeTypes.length > 0 && !selectedNadeTypes.includes(lineup.nadeType)) return false;

    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLineups();
    setRefreshing(false);
  };

  const openFilter = () => {
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

  const activeFilterCount = selectedSides.length + selectedSites.length + selectedNadeTypes.length;

  // Show loading spinner on first load
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search lineups..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
          <Ionicons name="options" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lineup Grid */}
      <FlatList
        data={filteredLineups}
        renderItem={({ item }) => (
          <LineupCard lineup={item} navigation={navigation} />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6800" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={60} color="#4a4a4a" />
            <Text style={styles.emptyText}>No lineups found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Filter Panel */}
      {filterVisible && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={closeFilter}
          />
          <Animated.View 
            style={[
              styles.filterPanel,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={closeFilter}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              {/* Side Filter */}
              <Text style={styles.filterSectionTitle}>Side</Text>
              <View style={styles.filterOptions}>
                {['T', 'CT'].map(side => (
                  <TouchableOpacity
                    key={side}
                    style={[styles.filterOption, tempSides.includes(side) && styles.filterOptionActive]}
                    onPress={() => toggleTempSide(side)}
                  >
                    <Text style={[styles.filterOptionText, tempSides.includes(side) && styles.filterOptionTextActive]}>
                      {side}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Site Filter */}
              <Text style={styles.filterSectionTitle}>Site</Text>
              <View style={styles.filterOptions}>
                {['A', 'Mid', 'B'].map(site => (
                  <TouchableOpacity
                    key={site}
                    style={[styles.filterOption, tempSites.includes(site) && styles.filterOptionActive]}
                    onPress={() => toggleTempSite(site)}
                  >
                    <Text style={[styles.filterOptionText, tempSites.includes(site) && styles.filterOptionTextActive]}>
                      {site}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nade Type Filter */}
              <Text style={styles.filterSectionTitle}>Grenade Type</Text>
              <View style={styles.filterOptions}>
                {['Smoke', 'Flash', 'Molotov', 'HE'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, tempNadeTypes.includes(type) && styles.filterOptionActive]}
                    onPress={() => toggleTempNadeType(type)}
                  >
                    <Text style={[styles.filterOptionText, tempNadeTypes.includes(type) && styles.filterOptionTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearButton2} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  filterButtonContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterBadge: {
    backgroundColor: '#FF6800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  filterOptionActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  filterOptionText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  clearButton2: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6800',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});