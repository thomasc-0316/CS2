import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('favorites'); // 'myLineups', 'favorites', 'upvotes'
  const [bio, setBio] = useState(''); // Bio state

  const favoriteIds = getFavorites();
  const favoriteLineups = LINEUPS.filter(lineup => favoriteIds.includes(lineup.id));

  // For now, "My Lineups" is empty (user hasn't posted any)
  const myLineups = [];

  // Get upvoted lineups (we don't track this yet, but let's prepare for it)
  const upvotedLineups = [];

  const getMapName = (mapId) => {
    const map = MAPS.find(m => m.id === mapId);
    return map ? map.name : 'Unknown';
  };

  const getActiveLineups = () => {
    switch (activeTab) {
      case 'myLineups':
        return myLineups;
      case 'favorites':
        return favoriteLineups;
      case 'upvotes':
        return upvotedLineups;
      default:
        return [];
    }
  };

  const activeLineups = getActiveLineups();

  const renderHeader = () => (
    <View>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#FF6800" />
          {/* Edit Avatar Button */}
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>Player</Text>
        
        {/* Bio Section */}
        <TouchableOpacity style={styles.bioContainer}>
          <Text style={bio ? styles.bioText : styles.bioPlaceholder}>
            {bio || 'Tap here to fill in your bio'}
          </Text>
        </TouchableOpacity>
        
        {/* Edit Profile and Settings Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsButtonMain}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favoriteLineups.length}</Text>
            <Text style={styles.statLabel}>Saves</Text>
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
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'upvotes' && styles.tabActive]}
          onPress={() => setActiveTab('upvotes')}
        >
          <Text style={[styles.tabText, activeTab === 'upvotes' && styles.tabTextActive]}>
            Upvotes
          </Text>
        </TouchableOpacity>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchLineups')}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
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

  const renderEmptyState = () => {
    let message = '';
    if (activeTab === 'myLineups') {
      message = 'No lineups posted yet';
    } else if (activeTab === 'favorites') {
      message = 'No favorites yet\nTap the star on any lineup to save it';
    } else {
      message = 'No upvoted lineups yet';
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={activeTab === 'favorites' ? 'star-outline' : 'cloud-upload-outline'} 
          size={80} 
          color="#4a4a4a" 
        />
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={activeLineups}
        renderItem={renderLineupCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
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
    marginBottom: 10,
  },
  bioContainer: {
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  bioText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  editProfileButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  settingsButtonMain: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 350,
  },
  statBox: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#aaa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
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
    fontSize: 14,
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
    fontSize: 16,
    color: '#aaa',
    marginTop: 20,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2a2a2a',
  },
});