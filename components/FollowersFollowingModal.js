import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFollow } from '../context/FollowContext';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

export default function FollowersFollowingModal({ visible, onClose, initialTab = 'followers' }) {
  const navigation = useNavigation();
  const { getFollowing, getFollowers, followUser, unfollowUser, isFollowing, refreshFollowers } = useFollow();
  const { profile } = useProfile();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const followers = getFollowers();
  const following = getFollowing();

  const currentList = activeTab === 'followers' ? followers : following;

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      refreshFollowers();
    }
  }, [visible, initialTab, refreshFollowers]);

  const handleFollowToggle = async (user) => {
    if (isFollowing(user.id, user.playerID, user.username)) {
      await unfollowUser(user.id, user.playerID, user.username);
    } else {
      await followUser(user.id, user.username, user.profilePicture, user.playerID);
    }
  };

  const handleOpenProfile = (user) => {
    if (!user?.id) return;
    onClose?.();
    navigation.navigate('UserProfile', { userId: user.id, username: user.username });
  };

  const renderUser = ({ item }) => {
    const isCurrentUser =
      item.id === currentUser?.uid ||
      (item.playerID && profile.playerID && item.playerID === profile.playerID);
    const followingUser = isFollowing(item.id, item.playerID, item.username);

    return (
      <View style={styles.userContainer}>
        <TouchableOpacity style={styles.userInfo} onPress={() => handleOpenProfile(item)}>
          <View style={styles.avatarContainer}>
            {item.profilePicture && typeof item.profilePicture === 'string' && item.profilePicture.trim() !== '' ? (
              <Image
                source={{ uri: item.profilePicture }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person-circle" size={44} color="#666" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.userId}>
              Player ID: {item.playerID || 'Not set'}
            </Text>
          </View>
        </TouchableOpacity>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[styles.followButton, followingUser && styles.followingButton]}
            onPress={() => handleFollowToggle(item)}
          >
            <Text style={[styles.followButtonText, followingUser && styles.followingButtonText]}>
              {followingUser ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
        size={60}
        color="#666"
      />
      <Text style={styles.emptyText}>
        {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'followers'
          ? 'When people follow you, they will appear here'
          : 'Find content creators to follow and see their lineups'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FF6800" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profile.username}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
              {followers.length} Followers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
              {following.length} Following
            </Text>
          </TouchableOpacity>
        </View>

        {/* User List */}
        <FlatList
          data={currentList}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 34,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    backgroundColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6800',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    paddingVertical: 10,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3a3a3a',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#666',
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
    fontSize: 13,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
