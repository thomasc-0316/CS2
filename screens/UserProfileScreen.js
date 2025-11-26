import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUpvotes } from '../context/UpvoteContext';
import { useFollow } from '../context/FollowContext';
import { MAPS } from '../data/maps';
import { useAuth } from '../context/AuthContext';

// Lineup card component
function LineupCard({ item, navigation, getMapName, getUpvoteCount }) {
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

        <View style={styles.upvoteContainer}>
          <Ionicons name="heart" size={16} color="#FF6800" />
          <Text style={styles.upvoteText}>{getUpvoteCount(item)} upvotes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen({ route }) {
  const navigation = useNavigation();
  const { userId } = route.params;
  const { getUpvoteCount } = useUpvotes();
  const { isFollowing, followUser, unfollowUser } = useFollow();
  const { getUserProfile, currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userLineups, setUserLineups] = useState([]);
  const [loadingLineups, setLoadingLineups] = useState(true);

  const loadUser = async () => {
    try {
      setLoadingUser(true);
      const liveUser = await getUserProfile(userId);
      setUser(liveUser || null);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadLineups = useCallback(
    async (profile) => {
      if (!userId) return;
      try {
        setLoadingLineups(true);
        let lineups = [];

        // Primary query by creatorId (Firebase UID)
        try {
          const lineupsQuery = query(
            collection(db, 'lineups'),
            where('creatorId', '==', userId),
            where('isPublic', '==', true)
          );
          const querySnapshot = await getDocs(lineupsQuery);
          lineups = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.error('Failed to load lineups by creatorId:', error);
        }

        // Fallback by playerID if provided and no results yet
        if ((!lineups || lineups.length === 0) && profile?.playerID) {
          try {
            const lineupsQuery = query(
              collection(db, 'lineups'),
              where('creatorPlayerId', '==', profile.playerID),
              where('isPublic', '==', true)
            );
            const querySnapshot = await getDocs(lineupsQuery);
            lineups = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (error) {
            console.error('Failed to load lineups by playerID:', error);
          }
        }

        // Sort client-side by uploadedAt desc
        lineups.sort((aItem, bItem) => {
          const aDate = aItem.uploadedAt?.toDate ? aItem.uploadedAt.toDate() : new Date(aItem.uploadedAt);
          const bDate = bItem.uploadedAt?.toDate ? bItem.uploadedAt.toDate() : new Date(bItem.uploadedAt);
          return bDate - aDate;
        });

        setUserLineups(lineups);
      } catch (error) {
        console.error('Failed to load user lineups:', error);
        setUserLineups([]);
      } finally {
        setLoadingLineups(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadUser();
  }, [userId]);

  // Load user's lineups from Firebase
  useEffect(() => {
    loadLineups(user);
  }, [userId, user, loadLineups]);

  // Refresh lineups when screen gains focus (captures new posts)
  useFocusEffect(
    useCallback(() => {
      loadLineups(user);
    }, [loadLineups, user])
  );

  const isFollowingUser = user ? isFollowing(user.id, user.playerID, user.username) : false;
  const isOwnProfile = currentUser?.uid === userId;

  // Use server follower count when available; fall back to optimistic +1 if we follow and no count exists yet
  const baseFollowerCount = user && typeof user.followers === 'number' ? user.followers : 0;
  const dynamicFollowerCount = baseFollowerCount > 0
    ? baseFollowerCount
    : (isFollowingUser ? 1 : 0);

  // Calculate total upvotes received on user's posts
  const totalUpvotesReceived = userLineups.reduce((total, lineup) => {
    return total + getUpvoteCount(lineup);
  }, 0);

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    if (isOwnProfile) return;
    if (followLoading) return;
    setFollowLoading(true);

    try {
      if (isFollowingUser) {
        await unfollowUser(user.id, user.playerID, user.username);
      } else {
        await followUser(user.id, user.username, user.profilePicture, user.playerID);
      }
      await loadUser();
    } finally {
      setFollowLoading(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.profileHeader}>
        {/* Top Row: Profile Picture + Username */}
        <View style={styles.topRow}>
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profilePicture}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <Ionicons name="person-circle" size={70} color="#FF6800" />
            )}
          </View>

          {/* Username and verification */}
          <View style={styles.userInfoContainer}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{user?.username || 'Unknown User'}</Text>
              {user?.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#5E98D9" style={styles.verifiedBadge} />
              )}
            </View>
            {user?.pronouns && (
              <Text style={styles.pronouns}>{user.pronouns}</Text>
            )}
          </View>
        </View>

        {/* Bio */}
        {user?.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Stats and Follow Button Row */}
        <View style={styles.statsAndButtonsRow}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{dynamicFollowerCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{userLineups.length}</Text>
              <Text style={styles.statLabel}>Lineups</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{totalUpvotesReceived}</Text>
              <Text style={styles.statLabel}>Upvotes</Text>
            </TouchableOpacity>
          </View>

          {/* Follow Button (right side) */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowingUser && styles.followingButton
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              <Text style={[
                styles.followButtonText,
                isFollowingUser && styles.followingButtonText
              ]}>
                {isFollowingUser ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lineups ({userLineups.length})</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <LineupCard
      item={item}
      navigation={navigation}
      getMapName={getMapName}
      getUpvoteCount={getUpvoteCount}
    />
  );

  const renderEmptyState = () => {
    if (loadingLineups) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#FF6800" />
          <Text style={styles.loadingText}>Loading lineups...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="cloud-upload-outline" size={80} color="#4a4a4a" />
        <Text style={styles.emptyText}>No lineups posted yet</Text>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const freshProfile = await getUserProfile(userId);
    setUser(freshProfile || null);
    await loadLineups(freshProfile || user);
    setRefreshing(false);
  };

  if (loadingUser) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} color="#FF6800" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF6800" />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userLineups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  profileHeader: {
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3a3a3a',
  },
  userInfoContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  pronouns: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bioContainer: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 6,
  },
  bioText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  statsAndButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#444',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
  },
  followButton: {
    backgroundColor: '#FF6800',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  sectionHeader: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  grid: {
    paddingHorizontal: 5,
    paddingBottom: 5,
  },
  lineupCard: {
    width: '47%',
    margin: 5,
    backgroundColor: '#1a1a1a',
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
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
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
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvoteText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6800',
    textAlign: 'center',
    marginTop: 20,
  },
});
