import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { IoBookmarkOutline, IoBookmark, IoHeart, IoHeartOutline } from 'react-icons/io5';
import { colors, radii, spacing } from '../theme/tokens';
import { useFavorites } from '@ctx/FavoritesContext.js';
import { useUpvotes } from '@ctx/UpvoteContext.js';

type PressableState = PressableStateCallbackType & { hovered?: boolean };

type Lineup = {
  id: string;
  title: string;
  description?: string;
  landImage?: string;
  nadeType?: string;
  side?: string;
  site?: string;
  mapId?: string;
  uploadedAt?: any;
  creatorUsername?: string;
  creatorId?: string;
};

type Props = {
  lineup: Lineup;
  onPress?: () => void;
  onCreatorPress?: () => void;
  compact?: boolean;
  rank?: number;
};

function formatDate(uploadedAt: any) {
  if (!uploadedAt) return '';
  const value = uploadedAt?.toDate ? uploadedAt.toDate() : new Date(uploadedAt);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleDateString();
}

export default function LineupCardWeb({ lineup, onPress, onCreatorPress, compact, rank }: Props) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleUpvote, isUpvoted, getUpvoteCount } = useUpvotes();

  const favorite = isFavorite(lineup.id);
  const upvoted = isUpvoted(lineup.id);
  const upvotes = getUpvoteCount(lineup);

  const imageSource = useMemo(() => {
    const uri =
      typeof lineup.landImage === 'string'
        ? lineup.landImage
        : (lineup as any).landImage?.uri;
    return uri ? { uri } : null;
  }, [lineup.landImage]);

  return (
    <Pressable
      style={({ hovered }: PressableState) => [
        styles.card,
        compact ? styles.cardCompact : null,
        hovered ? styles.cardHover : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.thumbnailWrapper}>
        {rank ? (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        ) : null}
        {imageSource ? (
          <Image source={imageSource} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Text style={styles.fallbackText}>No preview</Text>
          </View>
        )}
        <View style={styles.badgeRow}>
          {lineup.side ? <Text style={styles.badge}>{lineup.side}</Text> : null}
          {lineup.site ? <Text style={styles.badge}>{lineup.site}</Text> : null}
          {lineup.nadeType ? <Text style={styles.badge}>{lineup.nadeType}</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {lineup.title}
        </Text>
        {lineup.description ? (
          <Text style={styles.description} numberOfLines={compact ? 2 : 3}>
            {lineup.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {lineup.creatorUsername ? (
            <Pressable onPress={onCreatorPress} style={styles.creator}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>
                  {lineup.creatorUsername.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.creatorName}>{lineup.creatorUsername}</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }} />
          {lineup.uploadedAt ? (
            <Text style={styles.date}>{formatDate(lineup.uploadedAt)}</Text>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={(e: any) => {
              e.stopPropagation();
              toggleUpvote(lineup.id);
            }}
            style={({ hovered }: PressableState) => [
              styles.actionButton,
              upvoted ? styles.actionActive : null,
              hovered && !upvoted ? styles.actionHover : null,
            ]}
          >
            {upvoted ? (
              <IoHeart size={16} color="#0b0c10" />
            ) : (
              <IoHeartOutline size={16} color={colors.text} />
            )}
            <Text style={[styles.actionText, upvoted ? styles.actionTextActive : null]}>
              {upvotes}
            </Text>
          </Pressable>

          <Pressable
            onPress={(e: any) => {
              e.stopPropagation();
              toggleFavorite(lineup.id);
            }}
            style={({ hovered }: PressableState) => [
              styles.actionButton,
              favorite ? styles.actionActive : null,
              hovered && !favorite ? styles.actionHover : null,
            ]}
          >
            {favorite ? (
              <IoBookmark size={16} color="#0b0c10" />
            ) : (
              <IoBookmarkOutline size={16} color={colors.text} />
            )}
            <Text style={[styles.actionText, favorite ? styles.actionTextActive : null]}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  cardCompact: {
    maxWidth: 400,
  },
  cardHover: {
    transform: [{ translateY: -2 }],
    borderColor: colors.primary,
    shadowOpacity: 0.4,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnailFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.muted,
    fontWeight: '700',
  },
  badgeRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: colors.text,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 11,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
  },
  creatorName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  actionHover: {
    borderColor: colors.primary,
  },
  actionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  actionTextActive: {
    color: '#0b0c10',
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  rankText: {
    color: '#0b0c10',
    fontWeight: '800',
    fontSize: 12,
  },
});
