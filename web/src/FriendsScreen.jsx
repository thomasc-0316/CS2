import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFollow } from '../../context/FollowContext';

export default function FriendsScreen({ navigation }) {
  const { getFollowing, followers } = useFollow();
  const followingList = Object.entries(getFollowing()).map(([id, data]) => ({ id, ...data }));
  const followerList = Object.entries(followers || {}).map(([id, data]) => ({ id, ...data }));

  const renderCard = (item, label) => (
    <View key={item.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.username || 'Player'}</Text>
        {item.playerID ? <Text style={styles.sub}>{item.playerID}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
      >
        <Text style={styles.viewText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>People you follow and who follow you back.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Following</Text>
        {followingList.length === 0 ? (
          <Text style={styles.empty}>You are not following anyone yet.</Text>
        ) : (
          followingList.map((item) => renderCard(item, 'Following'))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Followers</Text>
        {followerList.length === 0 ? (
          <Text style={styles.empty}>No one is following you yet.</Text>
        ) : (
          followerList.map((item) => renderCard(item, 'Follower'))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    color: '#cbd5e1',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1017',
    borderWidth: 1,
    borderColor: '#1f2430',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  name: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  viewButton: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewText: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    color: '#94a3b8',
  },
});
