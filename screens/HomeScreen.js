import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MAPS } from '../data/maps';
import { useFollow } from '../context/FollowContext';
import CreatorDiscovery from '../components/CreatorDiscovery';
import LineupCard from '../components/LineupCard';

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'following'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'reserve'
  const [followingLineups, setFollowingLineups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getFollowing } = useFollow();

  const followingUsers = getFollowing();
  const followingUserIds = followingUsers.map(user => user.id);
  const isFollowingAnyone = followingUserIds.length > 0;

  // Fetch lineups from followed creators
  useEffect(() => {
    const fetchFollowingLineups = async () => {
      if (followingUserIds.length === 0) {
        setFollowingLineups([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Firebase has a limit of 10 items per 'in' query, so we need to batch
        const batches = [];
        for (let i = 0; i < followingUserIds.length; i += 10) {
          const batch = followingUserIds.slice(i, i + 10);
          batches.push(batch);
        }

        const allLineups = [];
        for (const batch of batches) {
          const q = query(
            collection(db, 'lineups'),
            where('creatorId', 'in', batch),
            where('isPublic', '==', true),
            orderBy('uploadedAt', 'desc')
          );

          const snapshot = await getDocs(q);
          const lineups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allLineups.push(...lineups);
        }

        // Sort all lineups by uploadedAt
        allLineups.sort((a, b) => {
          const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
          const bDate = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return bDate - aDate;
        });

        setFollowingLineups(allLineups);
      } catch (error) {
        console.error('Error fetching following lineups:', error);
        if (error.code === 'failed-precondition') {
          console.log('⚠️ Index required! Click the link in the error to create it.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'following') {
      fetchFollowingLineups();
    }
  }, [activeTab, followingUserIds.length]);

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

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6800" />
          <Text style={styles.loadingText}>Loading lineups...</Text>
        </View>
      );
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={60} color="#4a4a4a" />
              <Text style={styles.emptyText}>No lineups yet</Text>
              <Text style={styles.emptySubtext}>
                Creators you follow haven't posted any lineups
              </Text>
            </View>
          }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 15,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
