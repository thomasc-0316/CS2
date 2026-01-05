import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useNavigate } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import LineupCardWeb from '../components/LineupCardWeb';
import { colors, radii, spacing } from '../theme/tokens';
import { useAuth } from '@ctx/AuthContext.js';
import { useFollow } from '@ctx/FollowContext.js';
import { getLineupsByCreator } from '@services/lineupService.js';

type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { getFollowingCount, getFollowersCount } = useFollow();
  const [lineups, setLineups] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser?.uid) return;
      try {
        const data = await getLineupsByCreator(currentUser.uid);
        if (!cancelled) setLineups(data || []);
      } catch (error) {
        console.error('Failed to load my lineups', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  if (!currentUser) {
    return (
      <Surface>
        <Text style={styles.loading}>You need to sign in.</Text>
      </Surface>
    );
  }

  const profile = currentUser.profile || {};

  return (
    <View style={styles.page}>
      <Surface>
        <SectionHeading title={profile.username || 'Player'} subtitle={profile.bio || 'Ready to frag.'} />
        <View style={styles.badges}>
          {profile.playerID ? <Text style={styles.badge}>Player ID: {profile.playerID}</Text> : null}
          <Text style={styles.badge}>{getFollowersCount()} followers</Text>
          <Text style={styles.badge}>{getFollowingCount()} following</Text>
        </View>
        <Pressable
          onPress={async () => {
            await logout();
            navigate('/login');
          }}
          style={({ hovered }: PressableState) => [styles.logout, hovered ? styles.logoutHover : null]}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </Surface>

      <Surface>
        <SectionHeading title="My lineups" />
        <View style={styles.grid}>
          {lineups.map((lineup) => (
            <View key={lineup.id} style={styles.gridItem}>
              <LineupCardWeb
                lineup={lineup}
                onPress={() => navigate(`/lineups/${lineup.mapId || 'dust2'}/${lineup.id}`)}
              />
            </View>
          ))}
          {lineups.length === 0 ? <Text style={styles.empty}>No lineups published yet.</Text> : null}
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
  logout: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  logoutHover: {
    borderColor: colors.primary,
  },
  logoutText: {
    color: colors.text,
    fontWeight: '800',
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
