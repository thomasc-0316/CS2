import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MAPS } from '../data/maps';
import { useFollow } from '../context/FollowContext';
import { useUpvotes } from '../context/UpvoteContext';
import CreatorDiscovery from '../components/CreatorDiscovery';
import LineupCard from '../components/LineupCard';
import HotScreen from './HotScreen';
import MasonryList from '@react-native-seoul/masonry-list';

export default function HomeScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'following' | 'hot'
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'reserve'
  const [followingFilters, setFollowingFilters] = useState({
    map: 'all',
    type: 'all',
    side: 'all',
  });
  const [sortBy, setSortBy] = useState('hybrid'); // 'hybrid' | 'newest' | 'likes'
  const [filterVisible, setFilterVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(400));
  const [tempFilters, setTempFilters] = useState(followingFilters);
  const [followingLineups, setFollowingLineups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingBannerDismissed, setFollowingBannerDismissed] = useState(false);
  const { getFollowing } = useFollow();
  const { getUpvoteCount } = useUpvotes();

  const followingUsers = getFollowing();
  const followingUserIds = followingUsers.map(user => user.id);
  const followingPlayerIds = followingUsers.map(user => user.playerID).filter(Boolean);
  const isFollowingAnyone = followingUserIds.length > 0;

  useEffect(() => {
    const desiredTab = route?.params?.startTab;
    if (desiredTab) {
      setActiveTab(desiredTab);
      navigation?.setParams?.({ startTab: null });
    }
  }, [route?.params?.startTab]);

  // Load following banner dismissed state
  useEffect(() => {
    const loadBannerState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem('followingBannerDismissed');
        if (dismissed === 'true') {
          setFollowingBannerDismissed(true);
        }
      } catch (error) {
        console.error('Error loading banner state:', error);
      }
    };
    loadBannerState();
  }, []);

  const dismissFollowingBanner = async () => {
    try {
      await AsyncStorage.setItem('followingBannerDismissed', 'true');
      setFollowingBannerDismissed(true);
    } catch (error) {
      console.error('Error saving banner state:', error);
    }
  };

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

        const allLineupsMap = new Map();
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
          lineups.forEach((l) => allLineupsMap.set(l.id, l));
        }

        // Fallback queries by playerID if provided
        if (followingPlayerIds.length) {
          for (let i = 0; i < followingPlayerIds.length; i += 10) {
            const batch = followingPlayerIds.slice(i, i + 10);
            try {
              const q = query(
                collection(db, 'lineups'),
                where('creatorPlayerId', 'in', batch),
                where('isPublic', '==', true)
              );
              const snapshot = await getDocs(q);
              const lineups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              lineups.forEach((l) => allLineupsMap.set(l.id, l));
            } catch (err) {
              console.error('Error fetching by playerID batch:', err);
            }
          }
        }

        // Sort all lineups by uploadedAt
        const allLineups = Array.from(allLineupsMap.values());
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

  // Filters for following feed
  const availableMaps = useMemo(
    () => ['all', ...MAPS.map((m) => m.id)],
    []
  );
  const availableSides = useMemo(() => ['all', 't', 'ct'], []);
  const availableTypes = useMemo(() => {
    const set = new Set();
    followingLineups.forEach((l) => {
      if (l.nadeType) {
        set.add((l.nadeType || '').toLowerCase());
      }
    });
    // Ensure HE is present as an option
    set.add('he');
    return ['all', ...Array.from(set)];
  }, [followingLineups]);

  const filteredFollowingLineups = useMemo(() => {
    return followingLineups.filter((lineup) => {
      const mapMatch =
        followingFilters.map === 'all' ||
        lineup.mapId === followingFilters.map;
      const typeMatch =
        followingFilters.type === 'all' ||
        (lineup.nadeType || '').toLowerCase() === followingFilters.type;
      const sideMatch =
        followingFilters.side === 'all' ||
        (lineup.side || '').toLowerCase() === followingFilters.side;
      return mapMatch && typeMatch && sideMatch;
    });
  }, [followingLineups, followingFilters]);

  const sortedFollowingLineups = useMemo(() => {
    const items = [...filteredFollowingLineups];
    const now = Date.now();

    // Defaults for score-based sorting
    const b = 2;
    const c = 2;
    const alpha = 0.8;

    items.sort((a, bLineup) => {
      const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
      const bDate = bLineup.uploadedAt?.toDate ? bLineup.uploadedAt.toDate() : new Date(bLineup.uploadedAt);
      const aVotes = getUpvoteCount(a) || 0;
      const bVotes = getUpvoteCount(bLineup) || 0;

      if (sortBy === 'likes') {
        if (bVotes === aVotes) return bDate - aDate;
        return bVotes - aVotes;
      }

      if (sortBy === 'newest') {
        return bDate - aDate;
      }

      // Default: score-based hybrid
      const aAgeHours = Math.max(0, (now - aDate.getTime()) / 3600000);
      const bAgeHours = Math.max(0, (now - bDate.getTime()) / 3600000);
      const aScore = (aVotes + b) / Math.pow(aAgeHours + c, alpha);
      const bScore = (bVotes + b) / Math.pow(bAgeHours + c, alpha);
      return bScore - aScore;
    });

    return items;
  }, [filteredFollowingLineups, sortBy, getUpvoteCount]);

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

  const renderHotContent = () => (
    <View style={{ flex: 1 }}>
      <HotScreen navigation={navigation} />
    </View>
  );

  // Render Following Tab Content
  const renderFollowingContent = () => {
    if (!isFollowingAnyone) {
      // Show Creator Discovery when not following anyone
      return <CreatorDiscovery navigation={navigation} onExploreHot={() => setActiveTab('hot')} />;
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
        {!followingBannerDismissed && (
          <TouchableOpacity
            style={styles.followingHeader}
            onPress={dismissFollowingBanner}
            activeOpacity={0.7}
          >
            <View style={styles.followingHeaderContent}>
              <Ionicons name="people" size={20} color="#FF6800" />
              <Text style={styles.followingHeaderText}>
                Lineups from creators you follow
              </Text>
            </View>
            <Ionicons name="chevron-up" size={20} color="#888" />
          </TouchableOpacity>
        )}

        <View style={styles.sortAndFilterRow}>
          <View style={styles.sortButtonsContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortBy('hybrid')}
            >
              <Text style={[styles.sortText, sortBy === 'hybrid' && styles.sortTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortBy('newest')}
            >
              <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortBy('likes')}
            >
              <Text style={[styles.sortText, sortBy === 'likes' && styles.sortTextActive]}>Most Likes</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => {
              setTempFilters(followingFilters);
              setFilterVisible(true);
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Ionicons name="options" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {filterVisible && (
          <View style={styles.filterPortal} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={() => {
                Animated.timing(slideAnim, {
                  toValue: 400,
                  duration: 250,
                  useNativeDriver: true,
                }).start(() => setFilterVisible(false));
              }}
            />
            <Animated.View
              style={[
                styles.filterPanel,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.filterHeaderRow}>
                <Text style={styles.filterPanelTitle}>Filters</Text>
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(slideAnim, {
                      toValue: 400,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => setFilterVisible(false));
                  }}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Map</Text>
                <View style={styles.chipRow}>
                  {availableMaps.map((id) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.chip,
                        tempFilters.map === id && styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, map: id }))
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.map === id && styles.chipTextActive,
                        ]}
                      >
                        {id === 'all'
                          ? 'All'
                          : MAPS.find((m) => m.id === id)?.name || id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Type</Text>
                <View style={styles.chipRow}>
                  {availableTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        tempFilters.type === type && styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, type }))
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.type === type && styles.chipTextActive,
                        ]}
                      >
                        {type === 'all' ? 'All' : type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Side</Text>
                <View style={styles.chipRow}>
                  {availableSides.map((side) => (
                    <TouchableOpacity
                      key={side}
                      style={[
                        styles.chip,
                        tempFilters.side === side && styles.chipActive,
                      ]}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, side }))
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tempFilters.side === side && styles.chipTextActive,
                        ]}
                      >
                        {side === 'all' ? 'All' : side.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setTempFilters({ map: 'all', type: 'all', side: 'all' })}
                >
                  <Text style={styles.clearButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    setFollowingFilters(tempFilters);
                    Animated.timing(slideAnim, {
                      toValue: 400,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => setFilterVisible(false));
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <MasonryList
            data={sortedFollowingLineups}
            renderItem={({ item }) => (
              <LineupCard lineup={item} navigation={navigation} />
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.lineupGrid}
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

          {filterVisible && (
            <View style={styles.filterPortal} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={() => {
                  Animated.timing(slideAnim, {
                    toValue: 400,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => setFilterVisible(false));
                }}
              />
              <Animated.View
                style={[
                  styles.filterPanel,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View style={styles.filterHeaderRow}>
                  <Text style={styles.filterPanelTitle}>Filters</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Animated.timing(slideAnim, {
                        toValue: 400,
                        duration: 250,
                        useNativeDriver: true,
                      }).start(() => setFilterVisible(false));
                    }}
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Map</Text>
                  <View style={styles.chipRow}>
                    {availableMaps.map((id) => (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.chip,
                          tempFilters.map === id && styles.chipActive,
                        ]}
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, map: id }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            tempFilters.map === id && styles.chipTextActive,
                          ]}
                        >
                          {id === 'all'
                            ? 'All'
                            : MAPS.find((m) => m.id === id)?.name || id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Type</Text>
                  <View style={styles.chipRow}>
                    {availableTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chip,
                          tempFilters.type === type && styles.chipActive,
                        ]}
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, type }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            tempFilters.type === type && styles.chipTextActive,
                          ]}
                        >
                          {type === 'all' ? 'All' : type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Side</Text>
                  <View style={styles.chipRow}>
                    {availableSides.map((side) => (
                      <TouchableOpacity
                        key={side}
                        style={[
                          styles.chip,
                          tempFilters.side === side && styles.chipActive,
                        ]}
                        onPress={() =>
                          setTempFilters((prev) => ({ ...prev, side }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            tempFilters.side === side && styles.chipTextActive,
                          ]}
                        >
                          {side === 'all' ? 'All' : side.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setTempFilters({ map: 'all', type: 'all', side: 'all' })}
                  >
                    <Text style={styles.clearButtonText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => {
                      setFollowingFilters(tempFilters);
                      Animated.timing(slideAnim, {
                        toValue: 400,
                        duration: 250,
                        useNativeDriver: true,
                      }).start(() => setFilterVisible(false));
                    }}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          )}
        </View>
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
            style={[styles.headerTab, activeTab === 'hot' && styles.headerTabActive]}
            onPress={() => setActiveTab('hot')}
          >
            <Text style={[styles.headerTabText, activeTab === 'hot' && styles.headerTabTextActive]}>
              Hot
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
      {activeTab === 'following'
        ? renderFollowingContent()
        : activeTab === 'hot'
          ? renderHotContent()
          : (
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
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  followingHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followingHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  lineupGrid: {
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 10,
  },
  sortAndFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  sortButton: {
    paddingVertical: 6,
  },
  sortText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#fff',
  },
  filterIconButton: {
    padding: 0,
    marginLeft: 6,
  },
  filterSection: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 6,
  },
  filterSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  chipActive: {
    borderColor: '#FF6800',
    backgroundColor: '#2a1a10',
  },
  chipText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  filterPortal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterPanelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#222',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#FF6800',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
