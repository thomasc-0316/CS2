import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { useUpvotes } from '../context/UpvoteContext';
import { useDrafts } from '../context/DraftsContext';
import { LINEUPS } from '../data/lineups';
import { MAPS } from '../data/maps';

// Draft card component
function DraftCard({ item, navigation, onDelete }) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => {
        // TODO: Navigate to edit draft
        console.log('Edit draft:', item.id);
      }}
      onLongPress={() => onDelete(item.id)}
    >
      <Image
        source={{ uri: item.standImage }}
        style={styles.cardImage}
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
function LineupCard({ item, navigation, getMapName, getUpvoteCount }) {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={styles.lineupCard}
      onPress={() => navigation.navigate('Home', {
        screen: 'LineupDetail',
        params: { lineup: item }
      })}
    >
      <Image
        source={typeof item.standImage === 'string' ? { uri: item.standImage } : item.standImage}
        style={styles.cardImage}
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

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { getFavorites } = useFavorites();
  const { getUpvoteCount } = useUpvotes();
  const { drafts, deleteDraft } = useDrafts();
  const [activeTab, setActiveTab] = useState('favorites');
  const [bio, setBio] = useState('');

  const favoriteIds = getFavorites();
  const favoriteLineups = LINEUPS.filter(lineup => favoriteIds.includes(lineup.id));
  const myLineups = [];
  const upvotedLineups = [];

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

  const renderHeader = () => (
    <View>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#FF6800" />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>Player</Text>
        
        <TouchableOpacity style={styles.bioContainer}>
          <Text style={bio ? styles.bioText : styles.bioPlaceholder}>
            {bio || 'Tap here to fill in your bio'}
          </Text>
        </TouchableOpacity>
        
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
      return <DraftCard item={item} navigation={navigation} onDelete={handleDeleteDraft} />;
    }
    return (
      <LineupCard
        item={item}
        navigation={navigation}
        getMapName={getMapName}
        getUpvoteCount={getUpvoteCount}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={activeContent}
        renderItem={renderItem}
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
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6800',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#2a2a2a',
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
    backgroundColor: '#FF6800',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#666',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  draftBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: '#FF6800',
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
  draftDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
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
});