import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getUserById } from '../data/users';

export default function LineupCard({ lineup, navigation, rankBadge }) {
  const [imageLoading, setImageLoading] = useState(true);

  // Get creator info
  const creator = getUserById(lineup.creatorId);

  const handleCreatorPress = () => {
    if (!creator) return;
    navigation.navigate('UserProfile', { userId: creator.id, username: creator.username });
  };

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineupId: lineup.id })}
    >
      <Image
        source={typeof lineup.landImage === 'string' ? { uri: lineup.landImage } : lineup.landImage}
        style={styles.cardImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => setImageLoading(true)}
        onLoad={() => setImageLoading(false)}
      />

      {/* Loading Indicator */}
      {imageLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}

      {/* Rank Badge (for Hot screen) */}
      {rankBadge && (
        <View style={[styles.rankBadge, { backgroundColor: rankBadge.color }]}>
          <Text style={styles.rankText}>#{rankBadge.rank}</Text>
        </View>
      )}

      {/* Textbook Badge */}
      {lineup.isTextbook && (
        <View style={styles.textbookBadge}>
          <Ionicons name="book" size={16} color="#fff" />
        </View>
      )}

      <View style={styles.cardInfo}>
        {/* Creator Row */}
        {creator && (
          <TouchableOpacity 
            style={styles.creatorRow}
            onPress={handleCreatorPress}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={20} color="#888" />
            <Text style={styles.creatorName}>{creator.username}</Text>
            {creator.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#5E98D9" />
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.cardTitle} numberOfLines={1}>{lineup.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{lineup.description}</Text>
        
        <View style={styles.tags}>
          <Text style={styles.tag}>{lineup.side}</Text>
          <Text style={styles.tag}>{lineup.site}</Text>
          <Text style={styles.tag}>{lineup.nadeType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  lineupCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#3a3a3a',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textbookBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#5E98D9',
    borderRadius: 12,
    padding: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 10,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  rankText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginLeft: 4,
    marginRight: 3,
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
    gap: 4,
  },
  tag: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
});
