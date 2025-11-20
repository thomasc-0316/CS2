import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS } from '../data/maps';

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'following'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'reserve'

  // Filter maps based on toggle
  const getFilteredMaps = () => {
    if (filter === 'active') {
      return MAPS.filter(map => map.isActiveDuty);
    } else if (filter === 'reserve') {
      return MAPS.filter(map => !map.isActiveDuty);
    }
    return MAPS;
  };

  const filteredMaps = getFilteredMaps();

  const renderMapCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.mapCard}
        onPress={() => {
          if (!item.isLocked) {
            navigation.navigate('LineupGrid', { map: item });
          }
        }}
        disabled={item.isLocked}
      >
        <ImageBackground
          source={item.background}
          style={styles.mapBackground}
          imageStyle={styles.mapBackgroundImage}
        >
          {/* Dark overlay */}
          <View style={styles.darkOverlay} />

          {/* Locked overlay */}
          {item.isLocked && <View style={styles.lockedOverlay} />}

          {/* Map Icon */}
          <View style={styles.iconContainer}>
            <ImageBackground
              source={item.icon}
              style={styles.mapIcon}
              resizeMode="contain"
            />
          </View>

          {/* Lock Icon */}
          {item.isLocked && (
            <View style={styles.lockContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Menu and Tabs */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'explore' && styles.headerTabActive]}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.headerTabText, activeTab === 'explore' && styles.headerTabTextActive]}>
              Explore
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'following' && styles.headerTabActive]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.headerTabText, activeTab === 'following' && styles.headerTabTextActive]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, filter === 'all' && styles.toggleButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.toggleText, filter === 'all' && styles.toggleTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, filter === 'active' && styles.toggleButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.toggleText, filter === 'active' && styles.toggleTextActive]}>
            Active Duty
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, filter === 'reserve' && styles.toggleButtonActive]}
          onPress={() => setFilter('reserve')}
        >
          <Text style={[styles.toggleText, filter === 'reserve' && styles.toggleTextActive]}>
            Reserve
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Grid */}
      <FlatList
        data={filteredMaps}
        renderItem={renderMapCard}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
  },
  menuButton: {
    marginRight: 15,
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  headerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6800',
  },
  headerTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  headerTabTextActive: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6800',
  },
  toggleText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 10,
  },
  mapCard: {
    width: '44%',
    margin: 10,
    aspectRatio: 5/6,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBackgroundImage: {
    borderRadius: 15,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  iconContainer: {
    zIndex: 10,
  },
  mapIcon: {
    width: 75,
    height: 75,
  },
  lockContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 30,
  },
});
