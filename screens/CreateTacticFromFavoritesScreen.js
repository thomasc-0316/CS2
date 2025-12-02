import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTacticLibrary } from '../context/TacticLibraryContext';
import { getLineupById, getCreatorLineupsByMapAndSide } from '../services/lineupService';
import { createTactic } from '../services/tacticService';
import { MAPS } from '../data/maps';

export default function CreateTacticFromFavoritesScreen({ navigation, route }) {
  const mapId = route.params?.mapId || null;
  const side = (route.params?.side || 'T').toUpperCase();
  const map = route.params?.map || MAPS.find((m) => m.id === mapId);

  const { getFavorites } = useFavorites();
  const { currentUser } = useAuth();
  const { saveTactic } = useTacticLibrary();

  const [lineups, setLineups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const selectedCount = selectedIds.size;

  const loadLineups = useCallback(async () => {
    setError('');
    setLoadingLineups(true);
    try {
      const all = new Map();
      const favoriteIds = getFavorites();

      if (favoriteIds.length) {
        const favoriteDocs = await Promise.all(favoriteIds.map((id) => getLineupById(id)));
        favoriteDocs
          .filter(
            (lineup) =>
              lineup &&
              lineup.mapId === mapId &&
              (lineup.side || '').toUpperCase() === side,
          )
          .forEach((lineup) => {
            all.set(lineup.id, lineup);
          });
      }

      if (currentUser?.uid) {
        const mine = await getCreatorLineupsByMapAndSide(currentUser.uid, mapId, side);
        mine.forEach((lineup) => {
          all.set(lineup.id, lineup);
        });
      }

      const merged = Array.from(all.values());
      setLineups(merged);
      setSelectedIds(new Set(merged.map((l) => l.id)));
    } catch (err) {
      console.error('Failed to load lineups for tactic builder', err);
      setError('Could not load your lineups. Try again.');
    } finally {
      setLoadingLineups(false);
    }
  }, [currentUser?.uid, getFavorites, mapId, side]);

  useEffect(() => {
    loadLineups();
  }, [loadLineups]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!mapId) {
      setError('Pick a map to build your tactic.');
      return;
    }
    if (!selectedIds.size) {
      setError('Select at least one lineup.');
      return;
    }

    setError('');
    setCreating(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim() || 'Custom tactic',
      description: description.trim() || 'Built from your saved lineups.',
      mapId,
      side,
      lineupIds: Array.from(selectedIds),
      tags,
      isTextbook: false,
      isPublic: true,
      creatorId: currentUser?.uid || null,
      creatorUsername:
        currentUser?.profile?.username ||
        currentUser?.displayName ||
        currentUser?.email ||
        'Player',
      creatorPlayerId: currentUser?.profile?.playerID || null,
    };

    try {
      const created = await createTactic(payload);
      saveTactic({
        ...created,
        lineupIds: payload.lineupIds,
        tags: payload.tags,
        mapId,
        side,
      });
      navigation.navigate('TacticsMain', {
        map,
        startTab: 'explore',
        refresh: Date.now(),
      });
    } catch (err) {
      console.error('Failed to create tactic from favorites', err);
      setError('Could not create tactic. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderLineup = ({ item }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.lineupCard, selected && styles.lineupCardSelected]}
        onPress={() => toggleSelection(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.lineupImageWrapper}>
          <Image
            source={typeof item.landImage === 'string' ? { uri: item.landImage } : item.landImage}
            style={styles.lineupImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.lineupImageOverlay} />
          <View style={styles.selectionIcon}>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={selected ? '#1a1a1a' : '#FF6800'}
            />
          </View>
        </View>
        <View style={styles.lineupBody}>
          <Text style={styles.lineupTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.lineupMeta} numberOfLines={1}>
            {(item.side || '').toUpperCase()} • {item.site} • {item.nadeType}
          </Text>
          <Text style={styles.lineupDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Build a tactic</Text>
        <Text style={styles.headerSubtitle}>
          {map?.name || mapId || 'Select a map'} • {side} side
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Textbook A Hit"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="What is the plan for this tactic?"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="execute, default, strat name"
            placeholderTextColor="#666"
            value={tagsInput}
            onChangeText={setTagsInput}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            Select lineups ({selectedCount}/{lineups.length})
          </Text>
          {lineups.length ? (
            <TouchableOpacity onPress={() => setSelectedIds(new Set(lineups.map((l) => l.id)))}>
              <Text style={styles.selectAll}>Select all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }, [description, error, lineups.length, map?.name, mapId, selectedCount, side, tagsInput, title]);

  return (
    <View style={styles.container}>
      {loadingLineups ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6800" />
          <Text style={styles.loadingText}>Loading your lineups...</Text>
        </View>
      ) : (
        <FlatList
          data={lineups}
          renderItem={renderLineup}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color="#555" />
              <Text style={styles.emptyTitle}>No lineups to select</Text>
              <Text style={styles.emptySubtitle}>
                Favorite some lineups or post your own on this map/side to bundle them.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.createButton,
          (!selectedIds.size || creating) && styles.createButtonDisabled,
        ]}
        onPress={handleCreate}
        disabled={!selectedIds.size || creating}
        activeOpacity={0.85}
      >
        {creating ? (
          <ActivityIndicator color="#1a1a1a" />
        ) : (
          <Ionicons name="checkmark-circle" size={18} color="#1a1a1a" />
        )}
        <Text style={styles.createButtonText}>
          {creating ? 'Creating...' : 'Create tactic'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#FF6800',
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: '#ccc',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },
  multiline: {
    minHeight: 80,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  selectAll: {
    color: '#FF6800',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 96,
  },
  lineupCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#171717',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  lineupCardSelected: {
    borderColor: '#FF6800',
    shadowColor: '#FF6800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  lineupImageWrapper: {
    position: 'relative',
    height: 140,
    backgroundColor: '#2a2a2a',
  },
  lineupImage: {
    width: '100%',
    height: '100%',
  },
  lineupImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  selectionIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 4,
  },
  lineupBody: {
    padding: 12,
    gap: 6,
  },
  lineupTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  lineupMeta: {
    color: '#FF6800',
    fontWeight: '700',
    fontSize: 12,
  },
  lineupDescription: {
    color: '#999',
    fontSize: 12,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#888',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#888',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff8a80',
    fontWeight: '700',
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FF6800',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF6800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#1a1a1a',
    fontWeight: '800',
    fontSize: 16,
  },
});
