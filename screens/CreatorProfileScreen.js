import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getUserById } from '../data/users';
import { LINEUPS } from '../data/lineups';
import { useFollow } from '../context/FollowContext';
import LineupCard from '../components/LineupCard';

export default function CreatorProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { isFollowing, followUser, unfollowUser } = useFollow();
  
  const creator = getUserById(userId);
  const following = creator ? isFollowing(creator.id) : false;

  // Get all lineups by this creator
  const creatorLineups = LINEUPS.filter(lineup => lineup.creatorId === userId);

  if (!creator) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#666" />
        <Text style={styles.errorText}>Creator not found</Text>
      </View>
    );
  }

  const handleFollowToggle = () => {
    if (following) {
      unfollowUser(creator.id);
    } else {
      followUser(creator.id, creator.username, creator.profilePicture);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          {creator.profilePicture ? (
            <Image
              source={{ uri: creator.profilePicture }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person-circle" size={100} color="#666" />
            </View>
          )}
        </View>

        {/* Name and Verified Badge */}
        <View style={styles.nameRow}>
          <Text style={styles.username}>{creator.username}</Text>
          {creator.isVerified && (
            <Ionicons name="checkmark-circle" size={24} color="#5E98D9" />
          )}
        </View>

        {/* Pronouns */}
        {creator.pronouns && (
          <Text style={styles.pronouns}>{creator.pronouns}</Text>
        )}

        {/* Bio */}
        {creator.bio && (
          <Text style={styles.bio}>{creator.bio}</Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{creator.followers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{creator.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{creatorLineups.length}</Text>
            <Text style={styles.statLabel}>Lineups</Text>
          </View>
        </View>

        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={handleFollowToggle}
        >
          <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lineups Section */}
      <View style={styles.lineupsSection}>
        <Text style={styles.sectionTitle}>
          {creatorLineups.length} {creatorLineups.length === 1 ? 'Lineup' : 'Lineups'}
        </Text>
        
        {creatorLineups.length > 0 ? (
          <FlatList
            data={creatorLineups}
            renderItem={({ item }) => (
              <LineupCard lineup={item} navigation={navigation} />
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={60} color="#4a4a4a" />
            <Text style={styles.emptyText}>No lineups yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2a2a2a',
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3a3a3a',
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  pronouns: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  bio: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#4a4a4a',
  },
  followButton: {
    backgroundColor: '#FF6800',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4a4a4a',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#fff',
  },
  lineupsSection: {
    flex: 1,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
  },
});