import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import ImageView from 'react-native-image-viewing';
import { useUpvotes } from '../context/UpvoteContext';
import { useFavorites } from '../context/FavoritesContext';
import { useComments } from '../context/CommentsContext';
import CommentsModal from '../components/CommentsModal';

export default function LineupDetailScreen({ route }) {
  const { lineup } = route.params;
  const { toggleUpvote, isUpvoted, getUpvoteCount } = useUpvotes();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getCommentCount } = useComments();

  const upvoted = isUpvoted(lineup.id);
  const upvoteCount = getUpvoteCount(lineup);
  const favorited = isFavorite(lineup.id);
  const commentCount = getCommentCount(lineup.id);

  // Image viewing state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showThirdPerson, setShowThirdPerson] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [standImageLoading, setStandImageLoading] = useState(true);
  const [aimImageLoading, setAimImageLoading] = useState(true);
  const [landImageLoading, setLandImageLoading] = useState(true);
  const [thirdPersonLoading, setThirdPersonLoading] = useState(true);
  // Check if third person image exists
  const hasThirdPerson = !!lineup.standImageThirdPerson;

  // Prepare images for viewer - handle both local and remote images
  const getImageUri = (imageSource) => {
    if (typeof imageSource === 'string') {
      return imageSource;
    }
    // Use Asset.fromModule for local assets
    const asset = Asset.fromModule(imageSource);
    return asset.localUri || asset.uri;
  };

  const images = [
    { uri: getImageUri(lineup.standImage) },
    { uri: getImageUri(lineup.aimImage) },
    { uri: getImageUri(lineup.landImage) },
  ];

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you'd refetch data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6800"
          colors={['#FF6800']}
          progressBackgroundColor="#3a3a3a"
        />
      }
    >
      {/* Header Info */}
      <View style={styles.header}>
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

        {/* Upvote and Comment Buttons */}
        <View style={styles.actionButtonsContainer}>
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
              {upvoteCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => setCommentsVisible(true)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color="#fff"
            />
            <Text style={styles.commentText}>
              {commentCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Throw Instructions */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionLabel}>How to Throw:</Text>
        <Text style={styles.instructionText}>{lineup.throwType}</Text>
      </View>

      {/* Image 1: Where to Stand */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>1. Where to Stand</Text>
        <TouchableOpacity onPress={() => openImageViewer(0)} activeOpacity={0.9}>
          <Image
            source={typeof lineup.standImage === 'string' ? { uri: lineup.standImage } : lineup.standImage}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
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
              cachePolicy="memory-disk"
              transition={200}
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
            cachePolicy="memory-disk"
            transition={200}
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
            cachePolicy="memory-disk"
            transition={200}
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

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        lineupId={lineup.id}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  favoriteButton: {
    padding: 5,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 15,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  upvoteButton: {
    flex: 3,
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
  commentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  commentText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
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
  },
  thirdPersonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaa',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  textbookBadgeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E98D9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  textbookLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
});