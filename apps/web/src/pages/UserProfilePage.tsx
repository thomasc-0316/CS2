import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import LineupCardWeb from '../components/LineupCardWeb';
import { colors, radii, spacing } from '../theme/tokens';
import { useAuth } from '@ctx/AuthContext.js';
import { useFollow } from '@ctx/FollowContext.js';
import { getLineupsByCreator } from '@services/lineupService.js';

type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId;
  const { getUserProfile, currentUser } = useAuth();
  const { isFollowing, followUser, unfollowUser } = useFollow();
  const [profile, setProfile] = useState<any | null>(null);
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const data = await getUserProfile(userId);
        if (!cancelled) setProfile(data);
        const l = await getLineupsByCreator(userId);
        if (!cancelled) setLineups(l || []);
      } catch (error) {
        console.error('Failed to load user profile', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, getUserProfile]);

  if (loading) {
    return (
      <Surface>
        <Text style={styles.loading}>Loading user...</Text>
      </Surface>
    );
  }

  if (!profile) {
    return (
      <Surface>
        <Text style={styles.loading}>User not found.</Text>
      </Surface>
    );
  }

  const following = isFollowing(profile.id, profile.playerID, profile.username);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (following) {
      await unfollowUser(profile.id, profile.playerID, profile.username);
    } else {
      await followUser(profile.id, profile.username, profile.profilePicture, profile.playerID);
    }
  };

  return (
    <View style={styles.page}>
      <Surface>
        <SectionHeading title={profile.username || 'Player'} subtitle={profile.bio || ''} />
        <View style={styles.badges}>
          {profile.playerID ? <Text style={styles.badge}>Player ID: {profile.playerID}</Text> : null}
          <Text style={styles.badge}>{profile.followers || 0} followers</Text>
        </View>
        <Pressable
          onPress={handleFollow}
          style={({ hovered }: PressableState) => [
            styles.followButton,
            following ? styles.followButtonActive : null,
            hovered && !following ? styles.followButtonHover : null,
          ]}
        >
          <Text style={[styles.followText, following ? styles.followTextActive : null]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </Surface>

      <Surface>
        <SectionHeading title="Published lineups" />
        <View style={styles.grid}>
          {lineups.map((lineup) => (
            <View key={lineup.id} style={styles.gridItem}>
              <LineupCardWeb
                lineup={lineup}
                onPress={() => navigate(`/lineups/${lineup.mapId || 'dust2'}/${lineup.id}`)}
              />
            </View>
          ))}
          {lineups.length === 0 ? <Text style={styles.empty}>No lineups yet.</Text> : null}
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  loading: {
    color: colors.muted,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontWeight: '700',
  },
  followButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  followButtonHover: {
    borderColor: colors.primary,
  },
  followButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  followText: {
    color: colors.text,
    fontWeight: '800',
  },
  followTextActive: {
    color: '#0b0c10',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridItem: {
    flexBasis: '32%',
    minWidth: 260,
  },
  empty: {
    color: colors.muted,
    fontWeight: '700',
  },
});
