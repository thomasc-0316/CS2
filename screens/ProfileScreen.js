import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useUpvotes } from '../context/UpvoteContext';
import { LINEUPS } from '../data/lineups';
import { MAPS } from '../data/maps';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { getFavorites } = useFavorites();
  const { getUpvoteCount } = useUpvotes();

  const favoriteIds = getFavorites();
  const favoriteLineups = LINEUPS.filter(lineup => favoriteIds.includes(lineup.id));

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const renderHeader = () => (
    <View>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#FF6800" />
        </View>
        <Text style={styles.username}>Player</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favoriteLineups.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favoriteIds.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      {/* Favorites Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⭐ Favorite Lineups</Text>
      </View>
    </View>
  );

  const renderLineupCard = ({ item }) => (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('Home', {
        screen: 'LineupDetail',
        params: { lineup: item }
      })}
    >
      <Image source={{ uri: item.standImage }} style={styles.cardImage} />
      
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={80} color="#4a4a4a" />
      <Text style={styles.emptyText}>No favorites yet</Text>
      <Text style={styles.emptySubtext}>
        Tap the star on any lineup to save it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={favoriteLineups.length === 0 ? renderEmptyState : null}
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
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#2a2a2a',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  statBox: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6800',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  sectionHeader: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    marginTop: 5,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
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
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#3a3a3a',
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
    color: '#FF6800',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  upvoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#aaa',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});