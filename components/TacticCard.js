import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TacticCard({
  tactic,
  map,
  saved = false,
  onSave,
  onLineupPress,
  onPress,
}) {
  const previewLineups = (tactic.lineups || []).slice(0, 3);
  const coverSource =
    tactic.coverImage ||
    previewLineups[0]?.landImage ||
    map?.background;
  const cover = typeof coverSource === 'string' ? { uri: coverSource } : coverSource;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.cardImageWrapper}
      >
        <ImageBackground
          source={cover}
          style={styles.cardImage}
          imageStyle={styles.cardImageInner}
        >
          <View style={styles.imageOverlay} />
          <View style={styles.cardTopRow}>
            <View style={styles.sideBadge}>
              <Text style={styles.sideBadgeText}>{(tactic.side || '').toUpperCase()}</Text>
            </View>
            <View style={styles.iconBadgeRow}>
              {tactic.tags?.includes('textbook') && (
                <View style={styles.iconBadge}>
                  <Ionicons name="book" size={14} color="#fff" />
                </View>
              )}
              {tactic.tags?.includes('custom') && (
                <View style={styles.iconBadge}>
                  <Ionicons name="star" size={14} color="#fff" />
                </View>
              )}
            </View>
          </View>
          {map?.name ? (
            <View style={styles.mapLabel}>
              <Ionicons name="map-outline" size={12} color="#fff" />
              <Text style={styles.mapLabelText}>{map.name}</Text>
            </View>
          ) : null}
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{tactic.title}</Text>
          <TouchableOpacity
            onPress={onSave}
            style={[styles.saveButton, saved && styles.saveButtonActive]}
            activeOpacity={0.9}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? '#1a1a1a' : '#fff'}
            />
            <Text style={[styles.saveText, saved && styles.saveTextActive]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={2}>{tactic.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="git-branch-outline" size={12} color="#FF6800" />
            <Text style={styles.metaText}>
              {tactic.lineupCount || tactic.lineups?.length || 0} lineups
            </Text>
          </View>
          {tactic.tags?.length ? (
            <View style={styles.metaPill}>
              <Ionicons name="pricetags-outline" size={12} color="#FF6800" />
              <Text style={styles.metaText} numberOfLines={1}>
                {tactic.tags.join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.previewRow}>
          {previewLineups.length ? (
            previewLineups.map((lineup) => (
              <TouchableOpacity
                key={lineup.id}
                style={styles.previewChip}
                onPress={() => onLineupPress?.(lineup)}
                activeOpacity={0.85}
              >
                <Text style={styles.previewChipText} numberOfLines={1}>
                  {lineup.title}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyPreview}>
              Lineups will appear once linked.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2f2f2f',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardImageWrapper: {
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: 160,
    justifyContent: 'space-between',
  },
  cardImageInner: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  sideBadge: {
    backgroundColor: '#FF6800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sideBadgeText: {
    color: '#1a1a1a',
    fontWeight: '800',
    fontSize: 12,
  },
  iconBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  mapLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    margin: 12,
  },
  mapLabelText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveButtonActive: {
    backgroundColor: '#FF6800',
    borderColor: '#FF6800',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  saveTextActive: {
    color: '#1a1a1a',
  },
  description: {
    color: '#c8c8c8',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaText: {
    color: '#d0d0d0',
    fontSize: 12,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  previewChip: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  previewChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPreview: {
    color: '#777',
    fontSize: 12,
  },
});
