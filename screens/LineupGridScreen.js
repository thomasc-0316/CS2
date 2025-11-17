import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Image,
  Animated
} from 'react-native';
import { LINEUPS } from '../data/lineups';

export default function LineupGridScreen({ navigation, route }) {
  const { map } = route.params;
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(300));
  
  // Applied filter states (actually used for filtering)
  const [selectedSide, setSelectedSide] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedNadeType, setSelectedNadeType] = useState(null);

  // Temporary filter states (for the panel before applying)
  const [tempSide, setTempSide] = useState(null);
  const [tempSite, setTempSite] = useState(null);
  const [tempNadeType, setTempNadeType] = useState(null);

  // Get lineups for this map
  const mapLineups = LINEUPS.filter(lineup => lineup.mapId === map.id);

  // Apply filters
  const filteredLineups = mapLineups.filter(lineup => {
    if (selectedSide && lineup.side !== selectedSide) return false;
    if (selectedSite && lineup.site !== selectedSite) return false;
    if (selectedNadeType && lineup.nadeType !== selectedNadeType) return false;
    return true;
  }).sort((a, b) => b.uploadedAt - a.uploadedAt); // Sort by most recent

  const openFilter = () => {
    // Set temp filters to current applied filters
    setTempSide(selectedSide);
    setTempSite(selectedSite);
    setTempNadeType(selectedNadeType);
    
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
    setSelectedSide(tempSide);
    setSelectedSite(tempSite);
    setSelectedNadeType(tempNadeType);
    closeFilter();
  };

  const clearFilters = () => {
    setTempSide(null);
    setTempSite(null);
    setTempNadeType(null);
  };

  const renderLineupCard = ({ item }) => (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineup: item })}
    >
      <Image source={{ uri: item.standImage }} style={styles.cardImage} />
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

  return (
    <View style={styles.container}>
      {/* Header with Filter Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{map.name}</Text>
        <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
          <Text style={styles.filterButtonText}>⚙️ Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Lineup Grid */}
      <FlatList
        data={filteredLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
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
                style={[styles.filterOption, tempSide === 'T' && styles.filterOptionActive]}
                onPress={() => setTempSide(tempSide === 'T' ? null : 'T')}
              >
                <Text style={styles.filterOptionText}>T</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSide === 'CT' && styles.filterOptionActive]}
                onPress={() => setTempSide(tempSide === 'CT' ? null : 'CT')}
              >
                <Text style={styles.filterOptionText}>CT</Text>
              </TouchableOpacity>
            </View>

            {/* Site Filter */}
            <Text style={styles.filterLabel}>Site</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, tempSite === 'A' && styles.filterOptionActive]}
                onPress={() => setTempSite(tempSite === 'A' ? null : 'A')}
              >
                <Text style={styles.filterOptionText}>A</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSite === 'Mid' && styles.filterOptionActive]}
                onPress={() => setTempSite(tempSite === 'Mid' ? null : 'Mid')}
              >
                <Text style={styles.filterOptionText}>Mid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, tempSite === 'B' && styles.filterOptionActive]}
                onPress={() => setTempSite(tempSite === 'B' ? null : 'B')}
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
                  style={[styles.filterOption, tempNadeType === type && styles.filterOptionActive]}
                  onPress={() => setTempNadeType(tempNadeType === type ? null : type)}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterButton: {
    backgroundColor: '#4a4a4a',
    padding: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#27AE60',
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