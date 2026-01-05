import { Image, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { IoBookmark, IoBookmarkOutline, IoGitBranchOutline, IoMapOutline } from 'react-icons/io5';
import { colors, radii, spacing } from '../theme/tokens';

type Props = {
  tactic: any;
  mapName?: string;
  saved?: boolean;
  onSave?: () => void;
  onPress?: () => void;
};

type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function TacticCardWeb({ tactic, mapName, saved, onSave, onPress }: Props) {
  const coverSource =
    typeof tactic.coverImage === 'string'
      ? tactic.coverImage
      : tactic.coverImage?.uri || tactic.lineups?.[0]?.landImage;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: PressableState) => [styles.card, hovered ? styles.cardHover : null]}
    >
      {coverSource ? (
        <Image source={{ uri: coverSource }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverFallbackText}>Tactic</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.side}>{(tactic.side || '').toUpperCase()}</Text>
          {mapName ? (
            <View style={styles.mapPill}>
              <IoMapOutline size={12} color={colors.text} />
              <Text style={styles.mapText}>{mapName}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {tactic.title}
        </Text>
        {tactic.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {tactic.description}
          </Text>
        ) : null}
        <View style={styles.row}>
          <View style={styles.metaPill}>
            <IoGitBranchOutline size={12} color={colors.primary} />
            <Text style={styles.metaText}>
              {tactic.lineupCount || tactic.lineups?.length || tactic.lineupIds?.length || 0} lineups
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={(e: any) => {
              e.stopPropagation();
              onSave?.();
            }}
            style={({ hovered }: PressableState) => [
              styles.saveButton,
              saved ? styles.saveButtonActive : null,
              hovered && !saved ? styles.saveButtonHover : null,
            ]}
          >
            {saved ? (
              <IoBookmark size={14} color="#0b0c10" />
            ) : (
              <IoBookmarkOutline size={14} color={colors.text} />
            )}
            <Text style={[styles.saveText, saved ? styles.saveTextActive : null]}>
              {saved ? 'Saved' : 'Save'}
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: 'hidden',
    width: '100%',
  },
  cardHover: {
    borderColor: colors.primary,
    transform: [{ translateY: -2 }],
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  coverFallbackText: {
    color: colors.muted,
    fontWeight: '700',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  side: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  description: {
    color: colors.muted,
    fontSize: 13,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metaText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonHover: {
    borderColor: colors.primary,
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  saveTextActive: {
    color: '#0b0c10',
  },
});
