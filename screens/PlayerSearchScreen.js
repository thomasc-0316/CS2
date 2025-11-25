import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { collection, endAt, getDocs, limit, orderBy, query, startAt, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function PlayerSearchScreen({ navigation }) {
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const cacheRef = useRef(new Map());

  // Exact playerID match + case-insensitive prefix username search, cached to avoid repeat network calls.
  const searchPlayer = async () => {
    const raw = playerIdInput.trim();
    if (!raw) {
      setError('Enter a Player ID or username.');
      setResults([]);
      return;
    }

    const normalizedId = raw.toUpperCase();
    const lower = raw.toLowerCase();
    const cacheKey = lower;
    if (cacheRef.current.has(cacheKey)) {
      setError('');
      setResults(cacheRef.current.get(cacheKey));
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    Keyboard.dismiss();

    try {
      const qId = query(
        collection(db, 'users'),
        where('playerID', '==', normalizedId),
        limit(1)
      );
      const qUsernamePrefix = query(
        collection(db, 'users'),
        orderBy('usernameLower'),
        startAt(lower),
        endAt(`${lower}\uf8ff`),
        limit(10)
      );

      const [byIdSnap, byUsernameSnap] = await Promise.all([getDocs(qId), getDocs(qUsernamePrefix)]);

      const merged = [];
      const seen = new Set();

      const pushDoc = (docSnap) => {
        if (seen.has(docSnap.id)) return;
        seen.add(docSnap.id);
        merged.push({ id: docSnap.id, ...docSnap.data() });
      };

      byIdSnap.forEach(pushDoc);
      byUsernameSnap.forEach(pushDoc);

      if (!merged.length) {
        setError('No user found for that Player ID or username.');
        setResults([]);
      } else {
        cacheRef.current.set(cacheKey, merged);
        setResults(merged);
      }
    } catch (err) {
      console.error('Player search failed', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = (user) => {
    if (!user) return;
    navigation.navigate('UserProfile', {
      userId: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        <Text style={styles.title}>Find by Player ID</Text>
        <TextInput
          style={styles.input}
        value={playerIdInput}
        onChangeText={(text) => {
          setPlayerIdInput(text);
          setError('');
        }}
          placeholder="Enter Player ID or username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={searchPlayer}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchPlayer} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </>
          )}
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {results.map((user) => (
        <TouchableOpacity key={user.id} style={styles.resultCard} onPress={() => goToProfile(user)}>
          <View style={styles.avatar}>
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Ionicons name="person-circle" size={56} color="#FF6800" />
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.username}>{user.username || 'Unknown'}</Text>
            <Text style={styles.playerId}>Player ID: {user.playerID || 'N/A'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  searchCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    fontSize: 16,
  },
  searchButton: {
    marginTop: 12,
    backgroundColor: '#FF6800',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    color: '#ff8a80',
    fontSize: 14,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  resultInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerId: {
    color: '#aaa',
    fontSize: 13,
  },
});
