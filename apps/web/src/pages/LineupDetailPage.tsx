import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import Pill from '../components/Pill';
import { colors, radii, spacing } from '../theme/tokens';
import { getLineupById } from '@services/lineupService.js';
import { MAPS } from '@data/maps.js';
import { useUpvotes } from '@ctx/UpvoteContext.js';
import { useFavorites } from '@ctx/FavoritesContext.js';
import { useFollow } from '@ctx/FollowContext.js';
import { useAuth } from '@ctx/AuthContext.js';
import ImageViewing from 'react-native-image-viewing';

type MapData = {
  id: string;
  name: string;
  isActiveDuty?: boolean;
  isLocked?: boolean;
};
type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function LineupDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const lineupId = params.lineupId || '';
  const [lineup, setLineup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<any | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const { toggleUpvote, isUpvoted, getUpvoteCount } = useUpvotes();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isFollowing, followUser, unfollowUser } = useFollow();
  const { getUserProfile, currentUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data: any = await getLineupById(lineupId);
        if (!cancelled) setLineup(data);
        if (data?.creatorId && !cancelled) {
          try {
            const profile = await getUserProfile(data.creatorId);
            if (profile) setCreator(profile);
          } catch (err) {
            console.error('Failed to fetch creator profile', err);
          }
        }
      } catch (error) {
        console.error('Failed to load lineup', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (lineupId) load();
    return () => {
      cancelled = true;
    };
  }, [lineupId, getUserProfile]);

  const maps = MAPS as MapData[];
  const map = useMemo(
    () => maps.find((m) => m.id === (lineup?.mapId || params.mapId)) || maps[0],
    [maps, lineup?.mapId, params.mapId],
  );

  const upvoted = lineup ? isUpvoted(lineup.id) : false;
  const favorite = lineup ? isFavorite(lineup.id) : false;
  const upvotes = lineup ? getUpvoteCount(lineup) : 0;
  const followingCreator = creator
    ? isFollowing(creator.id, creator.playerID, creator.username)
    : false;

  const images = useMemo(() => {
    if (!lineup) return [];
    const list = [lineup.standImage, lineup.aimImage, lineup.landImage, lineup.moreDetailsImage]
      .filter(Boolean)
      .map((img: any) => ({
        uri: typeof img === 'string' ? img : img?.uri,
      }))
      .filter((img) => img.uri);
    return list;
  }, [lineup]);

  const handleFollowToggle = async () => {
    if (!creator) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      if (followingCreator) {
        await unfollowUser(creator.id, creator.playerID, creator.username);
      } else {
        await followUser(creator.id, creator.username, creator.profilePicture, creator.playerID);
      }
    } catch (error) {
      console.error('Follow toggle failed', error);
    }
  };

  if (loading) {
    return (
      <Surface>
        <Text style={styles.loading}>Loading lineup...</Text>
      </Surface>
    );
  }

  if (!lineup) {
    return (
      <Surface>
        <Text style={styles.loading}>Lineup not found.</Text>
      </Surface>
    );
  }

  return (
    <View style={styles.page}>
      <Pressable
        onPress={() => navigate(-1)}
        style={({ hovered }: PressableState) => [styles.back, hovered && styles.backHover]}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Surface>
        <SectionHeading
          title={lineup.title}
          subtitle={`${map?.name || 'Map'} • ${lineup.side || ''} • ${lineup.nadeType || ''}`}
        />
        <Text style={styles.description}>{lineup.description}</Text>

        <View style={styles.badges}>
          {lineup.side ? <Pill label={lineup.side} /> : null}
          {lineup.site ? <Pill label={`Site ${lineup.site}`} /> : null}
          {lineup.nadeType ? <Pill label={lineup.nadeType} /> : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => toggleUpvote(lineup.id)}
            style={({ hovered }: PressableState) => [
              styles.primaryButton,
              upvoted ? styles.primaryButtonActive : null,
              hovered && !upvoted ? styles.primaryButtonHover : null,
            ]}
          >
            <Text style={[styles.primaryButtonText, upvoted ? styles.primaryButtonTextActive : null]}>
              Upvote • {upvotes}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => toggleFavorite(lineup.id)}
            style={({ hovered }: PressableState) => [
              styles.secondaryButton,
              favorite ? styles.secondaryButtonActive : null,
              hovered && !favorite ? styles.secondaryButtonHover : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{favorite ? 'Saved' : 'Save for later'}</Text>
          </Pressable>
          {creator ? (
            <Pressable
              onPress={handleFollowToggle}
              style={({ hovered }: PressableState) => [
                styles.secondaryButton,
                followingCreator ? styles.secondaryButtonActive : null,
                hovered && !followingCreator ? styles.secondaryButtonHover : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {followingCreator ? 'Following' : 'Follow creator'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.infoRow}>
          {creator ? (
            <Pressable
              onPress={() => navigate(`/users/${creator.id}`)}
            style={({ hovered }: PressableState) => [
              styles.creatorCard,
              hovered ? styles.creatorCardHover : null,
            ]}
            >
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>
                  {(creator.username || 'Player').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>{creator.username || 'Player'}</Text>
                <Text style={styles.creatorMeta}>
                  {creator.playerID ? `ID: ${creator.playerID}` : 'Creator'}
                </Text>
              </View>
            </Pressable>
          ) : null}
          <View style={styles.mapBadge}>
            <Text style={styles.mapName}>{map?.name}</Text>
            <Text style={styles.mapMeta}>{map?.isActiveDuty ? 'Active Duty' : 'Reserve'}</Text>
          </View>
        </View>

        {images.length ? (
          <View style={styles.imageGrid}>
            {images.map((img, idx) => (
              <Pressable
                key={img.uri}
                onPress={() => {
                  setImageIndex(idx);
                  setImageViewerVisible(true);
                }}
                style={styles.imageCard}
              >
                <Image source={{ uri: img.uri }} style={styles.image} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        ) : null}

        {lineup.throwInstructions ? (
          <View style={styles.instructions}>
            <Text style={styles.sectionTitle}>Throw instructions</Text>
            <Text style={styles.instructionsText}>{lineup.throwInstructions}</Text>
          </View>
        ) : null}
      </Surface>

      <ImageViewing
        images={images}
        imageIndex={imageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backHover: {
    borderColor: colors.primary,
  },
  backText: {
    color: colors.text,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    marginTop: spacing.sm,
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonHover: {
    transform: [{ translateY: -1 }],
  },
  primaryButtonActive: {
    backgroundColor: colors.surface,
  },
  primaryButtonText: {
    color: '#0b0c10',
    fontWeight: '800',
  },
  primaryButtonTextActive: {
    color: colors.primary,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonHover: {
    borderColor: colors.primary,
  },
  secondaryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    minWidth: 220,
  },
  creatorCardHover: {
    borderColor: colors.primary,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    color: colors.text,
    fontWeight: '800',
  },
  creatorName: {
    color: colors.text,
    fontWeight: '800',
  },
  creatorMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  mapBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapName: {
    color: colors.text,
    fontWeight: '800',
  },
  mapMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  imageCard: {
    flexBasis: '32%',
    minWidth: 240,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  instructions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  instructionsText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  loading: {
    color: colors.muted,
    fontWeight: '700',
  },
});
