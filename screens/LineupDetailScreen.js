import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpvotes } from '../context/UpvoteContext';
import { useFavorites } from '../context/FavoritesContext';

export default function LineupDetailScreen({ route }) {
  const { lineup } = route.params;
  const { toggleUpvote, isUpvoted, getUpvoteCount } = useUpvotes();
  const { toggleFavorite, isFavorite } = useFavorites();

  const upvoted = isUpvoted(lineup.id);
  const upvoteCount = getUpvoteCount(lineup);
  const favorited = isFavorite(lineup.id);

  return (
    <ScrollView style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        {/* Title Row with Favorite Button */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{lineup.title}</Text>
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
      <View style={styles.instructionBox}>
        <Text style={styles.instructionLabel}>How to Throw:</Text>
        <Text style={styles.instructionText}>{lineup.throwType}</Text>
      </View>

      {/* Image 1: Where to Stand */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>1. Where to Stand</Text>
        <Image
          source={typeof lineup.standImage === 'string' ? { uri: lineup.standImage } : lineup.standImage}
          style={styles.image}
        />
      </View>

      {/* Image 2: Where to Aim */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>2. Where to Aim</Text>
        <Image
          source={typeof lineup.aimImage === 'string' ? { uri: lineup.aimImage } : lineup.aimImage}
          style={styles.image}
        />
      </View>

      {/* Image 3: Where it Lands */}
      <View style={styles.imageSection}>
        <Text style={styles.imageTitle}>3. Where it Lands</Text>
        <Image
          source={typeof lineup.landImage === 'string' ? { uri: lineup.landImage } : lineup.landImage}
          style={styles.image}
        />
      </View>
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
});