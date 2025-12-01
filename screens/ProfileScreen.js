import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useUpvotes } from '../context/UpvoteContext';
import { useDrafts } from '../context/DraftsContext';
import { useFollow } from '../context/FollowContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MAPS } from '../data/maps';
import FollowersFollowingModal from '../components/FollowersFollowingModal';
import { deleteLineupPost } from '../services/postService';

// Draft card component
function DraftCard({ item, navigation, onDelete, onEdit }) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => onEdit(item)}
      onLongPress={() => onDelete(item.id)}
    >
      <Image
        source={{ uri: item.standImage }}
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

      {/* Draft Badge */}
      <View style={styles.draftBadge}>
        <Ionicons name="bookmark" size={14} color="#fff" />
        <Text style={styles.draftBadgeText}>Draft</Text>
      </View>

      {/* Edit/Delete buttons for drafts */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.cardActionButton}
          onPress={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardActionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
        <View style={styles.tags}>
          {item.side && <Text style={styles.tag}>{item.side}</Text>}
          {item.site && <Text style={styles.tag}>{item.site}</Text>}
          {item.nadeType && <Text style={styles.tag}>{item.nadeType}</Text>}
        </View>
        <Text style={styles.draftDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Lineup card component
function LineupCard({ item, navigation, getMapName, getUpvoteCount, canEdit, onEdit, onDelete }) {
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

      {/* Edit/Delete buttons for user's own posts */}
      {canEdit && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardActionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
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

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { getFavorites } = useFavorites();
  const { getUpvoteCount } = useUpvotes();
  const { drafts, deleteDraft } = useDrafts();
  const { getFollowingCount, getFollowersCount } = useFollow();
  const { currentUser, logout, updateUserProfile } = useAuth();
  const { profile: storedProfile, updateProfile: updateLocalProfile } = useProfile();
  
  const [activeTab, setActiveTab] = useState('myLineups');
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');
  const [refreshing, setRefreshing] = useState(false);
  const [myLineups, setMyLineups] = useState([]);
  const [favoriteLineups, setFavoriteLineups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get user profile prioritizing locally edited profile, with Firebase as fallback
  const profileFromAuth = currentUser?.profile || {};
  const profileFromLocal = storedProfile || {};
  const profile = {
    bio: '',
    profilePicture: null,
    followers: 0,
    following: 0,
    totalLineups: 0,
    ...profileFromAuth,
    ...profileFromLocal,
    username:
      profileFromLocal.username
      || profileFromAuth.username
      || currentUser?.email?.split('@')[0]
      || 'User',
    playerID:
      profileFromLocal.playerID
      || profileFromAuth.playerID
      || 'N/A',
  };
  const followerCount = getFollowersCount() || profile.followers || 0;
  const followingCount = getFollowingCount() || profile.following || 0;

  const favoriteIds = getFavorites();
  const upvotedLineups = [];

  // Fetch user's lineups from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser && activeTab === 'myLineups') {
        try {
          setLoading(true);
          const q = query(
            collection(db, 'lineups'),
            where('creatorId', '==', currentUser.uid),
            where('isPublic', '==', true)
          );
          const snapshot = await getDocs(q);
          const lineups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          lineups.sort((a, b) => {
            const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
            const bDate = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
            return bDate - aDate;
          });
          setMyLineups(lineups);
        } catch (error) {
          console.error('Error fetching lineups:', error);
          Alert.alert(
            'Failed to Load Lineups',
            'Could not load your lineups. Please try again.',
            [{ text: 'OK' }]
          );
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [currentUser, activeTab]);

  // Fetch favorite lineups from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'favorites') {
        if (favoriteIds.length === 0) {
          setFavoriteLineups([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const stringIds = favoriteIds.map(id => id.toString());
          const batches = [];
          for (let i = 0; i < stringIds.length; i += 10) {
            const batch = stringIds.slice(i, i + 10);
            batches.push(batch);
          }

          const allLineups = [];
          for (const batch of batches) {
            const q = query(
              collection(db, 'lineups'),
              where('__name__', 'in', batch)
            );

            const snapshot = await getDocs(q);
            const lineups = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            allLineups.push(...lineups);
          }

          setFavoriteLineups(allLineups);
        } catch (error) {
          console.error('Error fetching favorite lineups:', error);
          Alert.alert(
            'Failed to Load Favorites',
            'Could not load your favorite lineups. Please try again.',
            [{ text: 'OK' }]
          );
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [activeTab, favoriteIds.length]);

  // Calculate total upvotes received on user's posts
  const totalUpvotesReceived = myLineups.reduce((total, lineup) => {
    return total + getUpvoteCount(lineup);
  }, 0);

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const handleDeleteDraft = (draftId) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDraft(draftId),
        },
      ]
    );
  };

  const handleEditDraft = (draft) => {
    // Navigate to PostScreen with draft data pre-filled
    navigation.navigate('Post', {
      screen: 'PostMain',
      params: {
        loadDraft: draft,
      },
    });
  };

  const handleEditLineup = async (lineup) => {
    // Navigate to PostScreen with lineup data for editing
    navigation.navigate('Post', {
      screen: 'PostMain',
      params: {
        editLineup: lineup,
      },
    });
  };

  const handleDeleteLineup = async (lineup) => {
    Alert.alert(
      'Delete Lineup',
      'Are you sure you want to delete this lineup? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLineupPost(lineup.id, currentUser);
              
              // Remove from local state
              setMyLineups(prev => prev.filter(item => item.id !== lineup.id));
              
              Alert.alert('Success', 'Lineup deleted successfully');
            } catch (error) {
              console.error('Error deleting lineup:', error);
              Alert.alert(
                'Delete Failed',
                error.message || 'Failed to delete lineup. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'myLineups':
        return myLineups;
      case 'favorites':
        return favoriteLineups;
      case 'upvotes':
        return upvotedLineups;
      case 'drafts':
        return drafts;
      default:
        return [];
    }
  };

  const activeContent = getActiveContent();

  const handleEditBio = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Edit Bio',
        'Enter your bio',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: async (text) => {
              try {
                const trimmed = (text || '').trim();
                await updateUserProfile({ bio: trimmed });
                updateLocalProfile({ ...profile, bio: trimmed });
              } catch (error) {
                Alert.alert('Error', 'Failed to update bio');
              }
            },
          },
        ],
        'plain-text',
        profile.bio
      );
    } else {
      // Android: take user to full edit screen
      navigation.navigate('EditProfile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const openFollowersModal = () => {
    setFollowModalTab('followers');
    setFollowModalVisible(true);
  };

  const openFollowingModal = () => {
    setFollowModalTab('following');
    setFollowModalVisible(true);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.profileHeader}>
        {/* Top Row: Profile Picture + Username/ID */}
        <View style={styles.topRow}>
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            {profile.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                style={styles.profilePicture}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <Ionicons name="person-circle" size={70} color="#FF6800" />
            )}
          </View>

          {/* Username and Player ID */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.playerID}>Player ID: {profile.playerID}</Text>
          </View>
        </View>

        {/* Bio - Tappable */}
        <TouchableOpacity style={styles.bioContainer} onPress={handleEditBio}>
          <Text style={profile.bio ? styles.bioText : styles.bioPlaceholder}>
            {profile.bio || 'Tap to add bio'}
          </Text>
        </TouchableOpacity>

        {/* Stats and Buttons Row */}
        <View style={styles.statsAndButtonsRow}>
          {/* Stats (left side, compact) */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={openFollowersModal}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={openFollowingModal}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{myLineups.length}</Text>
              <Text style={styles.statLabel}>Lineups</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalUpvotesReceived}</Text>
              <Text style={styles.statLabel}>Upvotes</Text>
            </View>
          </View>

          {/* Action Buttons (right side) */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButtonMain}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myLineups' && styles.tabActive]}
          onPress={() => setActiveTab('myLineups')}
        >
          <Text style={[styles.tabText, activeTab === 'myLineups' && styles.tabTextActive]}>
            My Lineups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'drafts' && styles.tabActive]}
          onPress={() => setActiveTab('drafts')}
        >
          <Text style={[styles.tabText, activeTab === 'drafts' && styles.tabTextActive]}>
            Drafts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchLineups')}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    if (activeTab === 'drafts') {
      return (
        <DraftCard
          item={item}
          navigation={navigation}
          onDelete={handleDeleteDraft}
          onEdit={handleEditDraft}
        />
      );
    }
    
    // For myLineups, allow edit/delete
    const canEdit = activeTab === 'myLineups';
    
    return (
      <LineupCard
        item={item}
        navigation={navigation}
        getMapName={getMapName}
        getUpvoteCount={getUpvoteCount}
        canEdit={canEdit}
        onEdit={handleEditLineup}
        onDelete={handleDeleteLineup}
      />
    );
  };

  const renderEmptyState = () => {
    let message = '';
    let iconName = '';
    
    if (activeTab === 'myLineups') {
      message = 'No lineups posted yet';
      iconName = 'cloud-upload-outline';
    } else if (activeTab === 'drafts') {
      message = 'No drafts saved yet\nSave a draft from the Post screen';
      iconName = 'bookmark-outline';
    } else if (activeTab === 'favorites') {
      message = 'No favorites yet\nTap the star on any lineup to save it';
      iconName = 'star-outline';
    } else {
      message = 'No upvoted lineups yet';
      iconName = 'heart-outline';
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name={iconName} size={80} color="#4a4a4a" />
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // Re-trigger the appropriate useEffect
    if (activeTab === 'myLineups' && currentUser) {
      try {
        const q = query(
          collection(db, 'lineups'),
          where('creatorId', '==', currentUser.uid),
          where('isPublic', '==', true)
        );
        const snapshot = await getDocs(q);
        const lineups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        lineups.sort((a, b) => {
          const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
          const bDate = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return bDate - aDate;
        });
        setMyLineups(lineups);
      } catch (error) {
        console.error('Error refreshing lineups:', error);
      }
    }

    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={activeContent}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6800" />
          </View>
        ) : renderEmptyState()}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6800"
            colors={['#FF6800']}
          />
        }
      />

      <FollowersFollowingModal
        visible={followModalVisible}
        onClose={() => setFollowModalVisible(false)}
        userId={currentUser?.uid}
        initialTab={followModalTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  profileHeader: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userInfoContainer: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerID: {
    fontSize: 13,
    color: '#999',
  },
  bioContainer: {
    marginBottom: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: '#666',
  },
  statsAndButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.65,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 12,
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 0.5,
    justifyContent: 'flex-end',
  },
  editProfileButton: {
    backgroundColor: '#3a3a3a',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButtonMain: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6800',
  },
  tabText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  searchButton: {
    width: 40,
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2a2a2a',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  textbookBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4169E1',
    borderRadius: 6,
    padding: 6,
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  draftBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  cardActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 15,
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
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    color: '#fff',
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
  draftDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});