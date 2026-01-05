import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useNavigate } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import LineupCardWeb from '../components/LineupCardWeb';
import Pill from '../components/Pill';
import { colors, radii, spacing } from '../theme/tokens';
import { MAPS } from '@data/maps.js';
import { getRecentLineups, getHotLineups } from '@services/lineupService.js';
import { useAuth } from '@ctx/AuthContext.js';

type MapData = {
  id: string;
  name: string;
  isLocked?: boolean;
  isActiveDuty?: boolean;
  background?: any;
};

type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recentLineups, setRecentLineups] = useState<any[]>([]);
  const [hotLineups, setHotLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapFilter, setMapFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [recent, hot] = await Promise.all([
          getRecentLineups(12),
          getHotLineups(12),
        ]);
        if (!cancelled) {
          setRecentLineups(recent || []);
          setHotLineups(hot || []);
        }
      } catch (error) {
        console.error('Failed to load home data', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredHot = useMemo(() => {
    if (mapFilter === 'all') return hotLineups;
    return hotLineups.filter((lineup) => lineup.mapId === mapFilter);
  }, [hotLineups, mapFilter]);

  const filteredRecent = useMemo(() => {
    if (mapFilter === 'all') return recentLineups;
    return recentLineups.filter((lineup) => lineup.mapId === mapFilter);
  }, [recentLineups, mapFilter]);

  const maps = MAPS as MapData[];
  const featuredMaps = maps.slice(0, 6);

  return (
    <View style={styles.page}>
      <Surface>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>CS2 Tactics & Lineups</Text>
            <Text style={styles.heroTitle}>Desktop-native experience for your squad</Text>
            <Text style={styles.heroSubtitle}>
              Browse curated nades, build tactics, and keep your team in sync. Designed for
              ultra-wide layouts with the same data and auth as the mobile app.
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.primaryButton,
                  hovered ? styles.primaryButtonHover : null,
                ]}
              onPress={() =>
                navigate(`/lineups/${maps.find((m) => !m.isLocked)?.id || maps[0]?.id}`)
              }
            >
                <Text style={styles.primaryButtonText}>Explore lineups</Text>
              </Pressable>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.secondaryButton,
                  hovered ? styles.secondaryButtonHover : null,
                ]}
                onPress={() => navigate('/tactics')}
              >
                <Text style={styles.secondaryButtonText}>Open tactics hub</Text>
              </Pressable>
            </View>
            <View style={styles.pills}>
              {['all', ...featuredMaps.map((m) => m.id)].map((id) => {
                const map = maps.find((m) => m.id === id);
                return (
                  <Pill
                    key={id}
                    label={map ? map.name : 'All maps'}
                    active={mapFilter === id}
                    onPress={() => setMapFilter(id)}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.heroPanel}>
            <View style={styles.heroPanelHeader}>
              <Text style={styles.panelTitle}>Quick access</Text>
              <Text style={styles.panelSub}>Jump into what matters.</Text>
            </View>
            <View style={styles.quickGrid}>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.quickCard,
                  hovered ? styles.quickCardHover : null,
                ]}
                onPress={() => navigate('/hot')}
              >
                <Text style={styles.quickTitle}>Trending</Text>
                <Text style={styles.quickSub}>Top upvoted nades right now.</Text>
              </Pressable>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.quickCard,
                  hovered ? styles.quickCardHover : null,
                ]}
                onPress={() => navigate('/post')}
              >
                <Text style={styles.quickTitle}>Create lineup</Text>
                <Text style={styles.quickSub}>
                  Share your nade with the team in minutes.
                </Text>
              </Pressable>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.quickCard,
                  hovered ? styles.quickCardHover : null,
                ]}
                onPress={() => navigate('/tactics')}
              >
                <Text style={styles.quickTitle}>Tactics board</Text>
                <Text style={styles.quickSub}>Bundle lineups into executable strats.</Text>
              </Pressable>
              <Pressable
                style={({ hovered }: PressableState) => [
                  styles.quickCard,
                  hovered ? styles.quickCardHover : null,
                ]}
                onPress={() => navigate('/room')}
              >
                <Text style={styles.quickTitle}>Room</Text>
                <Text style={styles.quickSub}>Sync up your roster and assignments.</Text>
              </Pressable>
            </View>
            {!currentUser ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Sign in to sync favorites, votes, and tactics across devices.
                </Text>
                <Pressable
                  onPress={() => navigate('/login')}
                  style={({ hovered }: PressableState) => [
                    styles.noticeButton,
                    hovered ? styles.noticeButtonHover : null,
                  ]}
                >
                  <Text style={styles.noticeButtonText}>Sign in</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Surface>

      <View style={styles.gridRow}>
        <View style={styles.column}>
          <Surface>
            <SectionHeading
              title="Latest drops"
              subtitle="Fresh lineups from the community."
              action={
                <Pressable onPress={() => navigate(`/lineups/${maps[0]?.id || 'dust2'}`)}>
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              }
            />
            <View style={styles.cardGrid}>
              {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `s${i}` })) : filteredRecent).map(
                (lineup: any) => (
                  <View key={lineup.id} style={styles.gridItem}>
                    {!loading ? (
                      <LineupCardWeb
                        lineup={lineup}
                        onPress={() =>
                          navigate(`/lineups/${lineup.mapId || maps[0]?.id}/${lineup.id}`)
                        }
                      />
                    ) : (
                      <View style={styles.skeleton} />
                    )}
                  </View>
                ),
              )}
              {!loading && filteredRecent.length === 0 ? (
                <Text style={styles.empty}>No lineups yet for this map.</Text>
              ) : null}
            </View>
          </Surface>
        </View>
        <View style={styles.column}>
          <Surface>
            <SectionHeading
              title="Hot right now"
              subtitle="Based on upvotes."
              action={
                <Pressable onPress={() => navigate('/hot')}>
                  <Text style={styles.link}>Open hot feed</Text>
                </Pressable>
              }
            />
            <View style={styles.listStack}>
              {(loading ? Array.from({ length: 5 }).map((_, i) => ({ id: `h${i}` })) : filteredHot).map(
                (lineup: any, index: number) => (
                  <View key={lineup.id} style={styles.listItem}>
                    {!loading ? (
                      <LineupCardWeb
                        lineup={lineup}
                        compact
                        rank={index + 1}
                        onPress={() =>
                          navigate(`/lineups/${lineup.mapId || maps[0]?.id}/${lineup.id}`)
                        }
                      />
                    ) : (
                      <View style={styles.skeletonRow} />
                    )}
                  </View>
                ),
              )}
              {!loading && filteredHot.length === 0 ? (
                <Text style={styles.empty}>No trending lineups for this map.</Text>
              ) : null}
            </View>
          </Surface>
        </View>
      </View>

      <Surface>
        <SectionHeading
          title="Featured maps"
          subtitle="Jump into a desktop-first layout for each map."
        />
        <View style={styles.mapGrid}>
          {featuredMaps.map((map) => (
            <Pressable
              key={map.id}
              onPress={() => navigate(`/lineups/${map.id}`)}
              style={({ hovered }: PressableState) => [
                styles.mapCard,
                hovered ? styles.mapCardHover : null,
                map.isLocked ? styles.mapLocked : null,
              ]}
            >
              <Image source={map.background} style={styles.mapBackground} resizeMode="cover" />
              <View style={styles.mapOverlay} />
              <View style={styles.mapContent}>
                <Text style={styles.mapName}>{map.name}</Text>
                <Text style={styles.mapMeta}>
                  {map.isActiveDuty ? 'Active Duty' : 'Reserve'} •{' '}
                  {map.isLocked ? 'Locked' : 'Open'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  heroText: {
    flex: 1,
    gap: spacing.md,
    minWidth: 320,
  },
  kicker: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: 15,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonHover: {
    transform: [{ translateY: -1 }],
  },
  primaryButtonText: {
    color: '#0b0c10',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonHover: {
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroPanel: {
    width: 360,
    maxWidth: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    flex: 1,
    minWidth: 280,
  },
  heroPanelHeader: {
    gap: spacing.xs,
  },
  panelTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  panelSub: {
    color: colors.muted,
    fontSize: 13,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickCard: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minWidth: 150,
  },
  quickCardHover: {
    borderColor: colors.primary,
  },
  quickTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  quickSub: {
    color: colors.muted,
    fontSize: 12,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  noticeText: {
    color: colors.text,
    fontWeight: '700',
  },
  noticeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  noticeButtonHover: {
    transform: [{ translateY: -1 }],
  },
  noticeButtonText: {
    color: '#0b0c10',
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  column: {
    flex: 1,
    minWidth: 320,
  },
  cardGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    flexBasis: '48%',
    minWidth: 280,
  },
  listStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listItem: {},
  link: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  skeleton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    height: 220,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonRow: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    height: 140,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    color: colors.muted,
    marginTop: spacing.md,
    fontWeight: '700',
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  mapCard: {
    flexBasis: '23%',
    minWidth: 200,
    height: 160,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  mapCardHover: {
    borderColor: colors.primary,
  },
  mapLocked: {
    opacity: 0.6,
  },
  mapBackground: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mapContent: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    gap: spacing.xs,
  },
  mapName: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  mapMeta: {
    color: colors.muted,
    fontSize: 12,
  },
});
