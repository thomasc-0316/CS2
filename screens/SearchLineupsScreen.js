import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MAPS } from '../data/maps';
import { useUpvotes } from '../context/UpvoteContext';
import { useFavorites } from '../context/FavoritesContext';
import MasonryList from '@react-native-seoul/masonry-list';

export default function SearchLineupsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLineups, setUserLineups] = useState([]);
  const { getUpvoteCount } = useUpvotes();
  const { getFavorites } = useFavorites();

  // Get user's lineups (posted, favorited, upvoted)
  const favoriteIds = getFavorites();
  const myLineupIds = []; // User hasn't posted any yet
  const upvotedIds = []; // We'll implement this later

  // Combine all user's lineup IDs
  const userLineupIds = [...new Set([...myLineupIds, ...favoriteIds, ...upvotedIds])];

  // Fetch user's lineups from Firebase
  useEffect(() => {
    fetchUserLineups();
  }, [favoriteIds.length]);

  const fetchUserLineups = async () => {
    if (userLineupIds.length === 0) {
      setUserLineups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Convert IDs to strings (Firebase document IDs are always strings)
      const stringIds = userLineupIds.map(id => id.toString());

      // Firebase has a limit of 10 items per 'in' query, so we need to batch
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

      setUserLineups(allLineups);
    } catch (error) {
      console.error('Error fetching user lineups:', error);
      Alert.alert(
        'Failed to Load Lineups',
        'Could not load your saved lineups. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  // Search within user's lineups only
  const filteredLineups = userLineups.filter(lineup => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lineup.title.toLowerCase().includes(query) ||
      lineup.description.toLowerCase().includes(query) ||
      getMapName(lineup.mapId).toLowerCase().includes(query)
    );
  });

  const renderLineupCard = ({ item }) => (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('LineupDetail', { lineupId: item.id })}
    >
      <Image
        source={typeof item.landImage === 'string' ? { uri: item.landImage } : item.landImage}
        style={styles.cardImage}
      />
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
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
      <Ionicons name="search-outline" size={80} color="#4a4a4a" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No results found' : 'No lineups saved yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search term' : 'Favorite some lineups to see them here'}
      </Text>
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserLineups();
    setRefreshing(false);
  };

  // Show loading spinner on first load
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6800" />
          <Text style={styles.loadingText}>Loading lineups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Avatar and Buttons */}
      <View style={styles.topHeader}>
        <View style={styles.avatarSmall}>
          <Ionicons name="person-circle" size={40} color="#FF6800" />
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search my lineups"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <MasonryList
        data={filteredLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
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
    </SafeAreaView>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  avatarSmall: {
    width: 40,
    height: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  cancelText: {
    color: '#FF6800',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  lineupCard: {
    flex: 1,
    marginBottom: 6,
    marginHorizontal: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    fontSize: 18,
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