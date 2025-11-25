import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS } from '../data/maps';
import { LINEUPS } from '../data/lineups';
import { useFollow } from '../context/FollowContext';
import CreatorDiscovery from '../components/CreatorDiscovery';
import LineupCard from '../components/LineupCard';

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'following'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'reserve'
  const { getFollowing } = useFollow();

  const followingUsers = getFollowing();
  const followingUserIds = followingUsers.map(user => user.id);
  const isFollowingAnyone = followingUserIds.length > 0;

  // Get lineups from followed creators
  const followingLineups = LINEUPS.filter(lineup => 
    followingUserIds.includes(lineup.creatorId)
  ).sort((a, b) => b.uploadedAt - a.uploadedAt);

  // Filter maps based on toggle (for Explore tab)
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

  // Render Following Tab Content
  const renderFollowingContent = () => {
    if (!isFollowingAnyone) {
      // Show Creator Discovery when not following anyone
      return <CreatorDiscovery navigation={navigation} />;
    }

    // Show lineups from followed creators as a grid (like Explore)
    return (
      <View style={styles.followingContentContainer}>
        <View style={styles.followingHeader}>
          <Ionicons name="people" size={20} color="#FF6800" />
          <Text style={styles.followingHeaderText}>
            Lineups from creators you follow
          </Text>
        </View>
        
        <FlatList
          data={followingLineups}
          renderItem={({ item }) => (
            <LineupCard lineup={item} navigation={navigation} />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.lineupGrid}
          columnWrapperStyle={styles.lineupRow}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Friend Search (left), Tabs, and Lineup Search placeholder (right) */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('PlayerSearch')}
        >
          <Ionicons name="people-circle" size={28} color="#FF6800" />
        </TouchableOpacity>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'following' && styles.headerTabActive]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.headerTabText, activeTab === 'following' && styles.headerTabTextActive]}>
              Following
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'explore' && styles.headerTabActive]}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={[styles.headerTabText, activeTab === 'explore' && styles.headerTabTextActive]}>
              Explore
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={() => {}}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'following' ? (
        renderFollowingContent()
      ) : (
        <>
          {/* Map Filter Toggle */}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menuButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  headerTab: {
    paddingVertical: 6,
  },
  headerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6800',
  },
  headerTabText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#888',
  },
  headerTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchButton: {
    padding: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    gap: 12,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleButtonActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  toggleText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 10,
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
  // Following feed styles
  followingContentContainer: {
    flex: 1,
  },
  followingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  followingHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  lineupGrid: {
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 10,
  },
  lineupRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
});
