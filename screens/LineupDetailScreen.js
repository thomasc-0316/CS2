import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import ImageView from 'react-native-image-viewing';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUpvotes } from '../context/UpvoteContext';
import { useFavorites } from '../context/FavoritesContext';
import { useFollow } from '../context/FollowContext';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';

export default function LineupDetailScreen({ route, navigation }) {
  const { lineupId } = route.params;

  const { toggleUpvote, isUpvoted, getUpvoteCount } = useUpvotes();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isFollowing, followUser, unfollowUser } = useFollow();
  const { getUserProfile, currentUser } = useAuth();

  // State for lineup loaded from Firebase
  const [lineup, setLineup] = useState(null);
  const [lineupLoading, setLineupLoading] = useState(true);

  // Get creator info from Firestore
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorSource, setCreatorSource] = useState('unknown');
  const lookupByUsername = useCallback(async (username) => {
    if (!username) return null;
    try {
      const lower = username.toLowerCase();
      const q = query(
        collection(db, 'users'),
        where('usernameLower', '==', lower),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (error) {
      console.error('Failed to lookup creator by username', error);
    }
    return null;
  }, []);
  const lookupByPlayerId = useCallback(async (playerID) => {
    if (!playerID) return null;
    try {
      const q = query(
        collection(db, 'users'),
        where('playerID', '==', playerID),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (error) {
      console.error('Failed to lookup creator by playerID', error);
    }
    return null;
  }, []);

  // Load lineup from Firebase
  useEffect(() => {
    let isMounted = true;
    const loadLineup = async () => {
      if (!lineupId) {
        setLineupLoading(false);
        return;
      }
      try {
        const lineupDoc = await getDoc(doc(db, 'lineups', lineupId));
        if (isMounted && lineupDoc.exists()) {
          setLineup({ id: lineupDoc.id, ...lineupDoc.data() });
        }
      } catch (error) {
        console.error('Failed to load lineup', error);
      } finally {
        if (isMounted) {
          setLineupLoading(false);
        }
      }
    };
    loadLineup();
    return () => {
      isMounted = false;
    };
  }, [lineupId]);

  useEffect(() => {
    let isMounted = true;
    const loadCreator = async () => {
      if (!lineup) return;
      try {
        const liveProfile = await getUserProfile(lineup.creatorId);
        const resolvedProfile =
          liveProfile ||
          (await lookupByPlayerId(lineup.creatorId)) ||
          (await lookupByUsername(lineup.creatorUsername));
        if (isMounted && resolvedProfile) {
          setCreatorProfile(resolvedProfile);
          setCreatorSource('live');
        }
      } catch (error) {
        console.error('Failed to load creator profile', error);
      }
    };
    loadCreator();
    return () => {
      isMounted = false;
    };
  }, [lineup, getUserProfile, lookupByUsername, lookupByPlayerId]);

  const creator = creatorProfile;
  const isFollowingCreator = creator ? isFollowing(creator.id, creator.playerID, creator.username) : false;
  const isOwnProfile = currentUser?.uid && creator?.id === currentUser.uid;
  const baseFollowerCount =
    creatorSource === 'live' && creator && typeof creator.followers === 'number'
      ? creator.followers
      : 0;
  const creatorFollowerCount = baseFollowerCount > 0 ? baseFollowerCount : (isFollowingCreator ? 1 : 0);

  // Image viewing state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showThirdPerson, setShowThirdPerson] = useState(false);

  const [standImageLoading, setStandImageLoading] = useState(true);
  const [aimImageLoading, setAimImageLoading] = useState(true);
  const [landImageLoading, setLandImageLoading] = useState(true);
  const [thirdPersonLoading, setThirdPersonLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const refreshCreator = async () => {
    if (!lineup) return;
    try {
      const updated = await getUserProfile(lineup.creatorId);
      if (updated) {
        setCreatorProfile(updated);
        setCreatorSource('live');
        return;
      }
      const fallback =
        (await lookupByPlayerId(lineup.creatorId)) ||
        (await lookupByUsername(lineup.creatorUsername));
      if (fallback) {
        setCreatorProfile(fallback);
        setCreatorSource('live');
        return;
      }
      setCreatorSource('unknown');
    } catch (error) {
      console.error('Failed to refresh creator profile', error);
    }
  };

  // Show loading state while lineup is loading
  if (lineupLoading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#FF6800" />
        <Text style={styles.loadingText}>Loading lineup...</Text>
      </View>
    );
  }

  // Show error if lineup not found
  if (!lineup) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#666" />
        <Text style={styles.errorText}>Lineup not found</Text>
      </View>
    );
  }

  const upvoted = isUpvoted(lineup.id);
  const upvoteCount = getUpvoteCount(lineup);
  const favorited = isFavorite(lineup.id);

  // Check if third person image exists
  const hasThirdPerson = !!lineup.standImageThirdPerson;

  // Prepare images for viewer - handle both local and remote images
  const getImageUri = (imageSource) => {
    if (!imageSource) return null;
    
    // If it's already a string URL (Firebase Storage), return it
    if (typeof imageSource === 'string') {
      return imageSource;
    }
    
    // If it's a require() (local image), get the asset URI
    try {
      const asset = Asset.fromModule(imageSource);
      return asset.localUri || asset.uri;
    } catch (error) {
      console.warn('Error loading image asset:', error);
      return null;
    }
  };

  const images = [
    { uri: getImageUri(lineup.standImage) },
    { uri: getImageUri(lineup.aimImage) },
    { uri: getImageUri(lineup.landImage) },
  ].filter(img => img.uri); // Remove any null images

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const handleFollowToggle = async () => {
    if (!creator) return;
    if (isOwnProfile) return;
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowingCreator) {
        await unfollowUser(creator.id, creator.playerID, creator.username);
      } else {
        await followUser(creator.id, creator.username, creator.profilePicture);
      }
      await refreshCreator();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCreatorPress = () => {
    if (!creator) return;
    navigation.navigate('UserProfile', { userId: creator.id, username: creator.username });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        {/* Creator Row */}
        {creator && (
          <View style={styles.creatorRow}>
            <TouchableOpacity 
              style={styles.creatorInfo}
              onPress={handleCreatorPress}
            >
              <View style={styles.creatorAvatarContainer}>
                {creator.profilePicture ? (
                  <Image
                    source={{ uri: creator.profilePicture }}
                    style={styles.creatorAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person-circle" size={40} color="#666" />
                )}
              </View>
              <View style={styles.creatorDetails}>
                <View style={styles.creatorNameRow}>
                  <Text style={styles.creatorUsername}>{creator.username}</Text>
                  {creator.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#5E98D9" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.creatorFollowers}>
                  {creatorFollowerCount.toLocaleString()} followers
                </Text>
              </View>
            </TouchableOpacity>
            
            {!isOwnProfile && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowingCreator && styles.followingButton
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                <Text style={[
                  styles.followButtonText,
                  isFollowingCreator && styles.followingButtonText
                ]}>
                  {isFollowingCreator ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Title Row with Favorite Button */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lineup.title}</Text>
            {lineup.isTextbook && (
              <View style={styles.textbookBadgeDetail}>
                <Ionicons name="book" size={14} color="#fff" />
                <Text style={styles.textbookLabel}>Textbook</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(lineup.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={favorited ? 'star' : 'star-outline'}
              size={28}
              color={favorited ? '#FFD700' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{lineup.description}</Text>
        
        <View style={styles.tags}>
          <Text style={styles.tag}>{lineup.side} Side</Text>
          <Text style={styles.tag}>{lineup.site} Site</Text>
          <Text style={styles.tag}>{lineup.nadeType}</Text>
        </View>

        {/* Upvote Button */}
        <TouchableOpacity
          style={[styles.upvoteButton, upvoted && styles.upvoteButtonActive]}
          onPress={() => toggleUpvote(lineup.id)}
        >
          <Ionicons 
            name={upvoted ? 'heart' : 'heart-outline'} 
            size={24} 
            color={upvoted ? '#fff' : '#FF6800'} 
          />
          <Text style={[styles.upvoteText, upvoted && styles.upvoteTextActive]}>
            {upvoteCount} upvotes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Throw Instructions */}
      {lineup.throwType && (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionLabel}>How to Throw:</Text>
          <Text style={styles.instructionText}>{lineup.throwType}</Text>
        </View>
      )}

      {/* Image 1: Where to Stand */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>1. Where to Stand</Text>
        <TouchableOpacity onPress={() => openImageViewer(0)} activeOpacity={0.9}>
          <Image
            source={typeof lineup.standImage === 'string' ? { uri: lineup.standImage } : lineup.standImage}
            style={styles.image}
            contentFit="cover"
            onLoadStart={() => setStandImageLoading(true)}
            onLoad={() => setStandImageLoading(false)}
          />
          {standImageLoading && (
            <View style={styles.detailImageLoading}>
              <ActivityIndicator size="small" color="#666" />
            </View>
          )}
          <View style={styles.zoomHint}>
            <Ionicons name="expand-outline" size={18} color="#fff" />
            <Text style={styles.zoomHintText}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>

        {/* Show More Details Button (if third person exists) */}
        {hasThirdPerson && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowThirdPerson(!showThirdPerson)}
          >
            <Ionicons
              name={showThirdPerson ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#FF6800"
            />
            <Text style={styles.showMoreText}>
              {showThirdPerson ? 'Hide' : 'Show'} Third-Person View
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Third Person Image (expanded) */}
      {hasThirdPerson && showThirdPerson && (
        <View style={styles.thirdPersonContainer}>
          <Text style={styles.thirdPersonLabel}>Third-Person Perspective:</Text>
          <TouchableOpacity activeOpacity={0.9}>
            <Image
              source={typeof lineup.standImageThirdPerson === 'string' 
                ? { uri: lineup.standImageThirdPerson } 
                : lineup.standImageThirdPerson}
              style={styles.image}
              contentFit="cover"
              onLoadStart={() => setThirdPersonLoading(true)}
              onLoad={() => setThirdPersonLoading(false)}
            />
            {thirdPersonLoading && (
              <View style={styles.detailImageLoading}>
                <ActivityIndicator size="small" color="#666" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Image 2: Where to Aim */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>2. Where to Aim</Text>
        <TouchableOpacity onPress={() => openImageViewer(1)} activeOpacity={0.9}>
          <Image
            source={typeof lineup.aimImage === 'string' ? { uri: lineup.aimImage } : lineup.aimImage}
            style={styles.image}
            contentFit="cover"
            onLoadStart={() => setAimImageLoading(true)}
            onLoad={() => setAimImageLoading(false)}
          />
          {aimImageLoading && (
            <View style={styles.detailImageLoading}>
              <ActivityIndicator size="small" color="#666" />
            </View>
          )}
          <View style={styles.zoomHint}>
            <Ionicons name="expand-outline" size={18} color="#fff" />
            <Text style={styles.zoomHintText}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Image 3: Where it Lands */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>3. Where it Lands</Text>
        <TouchableOpacity onPress={() => openImageViewer(2)} activeOpacity={0.9}>
          <Image
            source={typeof lineup.landImage === 'string' ? { uri: lineup.landImage } : lineup.landImage}
            style={styles.image}
            contentFit="cover"
            onLoadStart={() => setLandImageLoading(true)}
            onLoad={() => setLandImageLoading(false)}
          />
          {landImageLoading && (
            <View style={styles.detailImageLoading}>
              <ActivityIndicator size="small" color="#666" />
            </View>
          )}
          <View style={styles.zoomHint}>
            <Ionicons name="expand-outline" size={18} color="#fff" />
            <Text style={styles.zoomHintText}>Tap to zoom</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <ImageView
        images={images}
        imageIndex={currentImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatarContainer: {
    marginRight: 12,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  creatorUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  creatorFollowers: {
    fontSize: 13,
    color: '#888',
  },
  followButton: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  textbookBadgeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E98D9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  textbookLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 5,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6800',
  },
  upvoteButtonActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  upvoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6800',
    marginLeft: 10,
  },
  upvoteTextActive: {
    color: '#fff',
  },
  instructionBox: {
    backgroundColor: '#5E98D9',
    padding: 20,
    margin: 15,
    borderRadius: 10,
  },
  instructionLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageSection: {
    padding: 15,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
  },
  detailImageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  zoomHintText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF6800',
  },
  showMoreText: {
    color: '#FF6800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  thirdPersonContainer: {
    marginTop: 15,
    padding: 15,
  },
  thirdPersonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaa',
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#FF6800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});