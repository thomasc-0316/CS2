import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useNavigate } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import Surface from '../components/Surface';
import Pill from '../components/Pill';
import TacticCardWeb from '../components/TacticCardWeb';
import { colors, radii, spacing } from '../theme/tokens';
import { MAPS } from '@data/maps.js';
import { fetchPublicTactics, fetchUserTactics } from '@services/tacticService.js';
import { useTacticLibrary } from '@ctx/TacticLibraryContext.js';
import { useAuth } from '@ctx/AuthContext.js';

type Tab = 'featured' | 'my';

type MapData = {
  id: string;
  name: string;
  isLocked?: boolean;
  isActiveDuty?: boolean;
};
type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function TacticsPage() {
  const navigate = useNavigate();
  const { savedTactics, toggleTactic, isSaved } = useTacticLibrary();
  const { currentUser } = useAuth();
  const maps = MAPS as MapData[];

  const [selectedMapId, setSelectedMapId] = useState(maps[0]?.id || 'dust2');
  const [side, setSide] = useState<'T' | 'CT'>('T');
  const [tab, setTab] = useState<Tab>('featured');
  const [publicTactics, setPublicTactics] = useState<any[]>([]);
  const [myTacticsRemote, setMyTacticsRemote] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [publicList, personalList] = await Promise.all([
          fetchPublicTactics(selectedMapId, side),
          currentUser?.uid
            ? fetchUserTactics(currentUser.uid, selectedMapId, side)
            : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setPublicTactics(publicList || []);
          setMyTacticsRemote(personalList || []);
        }
      } catch (error) {
        console.error('Failed to load tactics', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, side, currentUser?.uid]);

  const tacticsToRender = useMemo(() => {
    const mapName = maps.find((m) => m.id === selectedMapId)?.name || 'Map';
    if (tab === 'my') {
      const merged = new Map<string, any>();
      [...savedTactics, ...myTacticsRemote].forEach((tactic) => {
        if ((tactic.mapId || selectedMapId) === selectedMapId && (tactic.side || side).toUpperCase() === side) {
          merged.set(tactic.id, {
            ...tactic,
            mapName,
            lineupCount: tactic.lineupCount || tactic.lineups?.length || tactic.lineupIds?.length,
          });
        }
      });
      return Array.from(merged.values());
    }
    return (publicTactics || []).map((tactic) => ({
      ...tactic,
      mapName,
    }));
  }, [tab, savedTactics, myTacticsRemote, publicTactics, selectedMapId, side]);

  return (
    <View style={styles.page}>
      <Surface>
        <SectionHeading
          title="Tactics hub"
          subtitle="Bundle your favorite lineups into executable strats."
          action={
            <Pressable
              onPress={() => navigate('/post')}
              style={({ hovered }: PressableState) => [
                styles.createButton,
                hovered ? styles.createButtonHover : null,
              ]}
            >
              <Text style={styles.createButtonText}>Create lineup</Text>
            </Pressable>
          }
        />
        <View style={styles.mapScroller}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {maps.map((map) => (
              <Pressable
                key={map.id}
                onPress={() => setSelectedMapId(map.id)}
                style={({ hovered }: PressableState) => [
                  styles.mapChip,
                  selectedMapId === map.id ? styles.mapChipActive : null,
                  hovered && selectedMapId !== map.id ? styles.mapChipHover : null,
                ]}
              >
                <Text
                  style={[
                    styles.mapChipText,
                    selectedMapId === map.id ? styles.mapChipTextActive : null,
                  ]}
                >
                  {map.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.pillRow}>
            {(['T', 'CT'] as const).map((s) => (
              <Pill key={s} label={s === 'T' ? 'T side' : 'CT side'} active={side === s} onPress={() => setSide(s)} />
            ))}
          </View>
          <View style={styles.tabRow}>
            {(['featured', 'my'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={({ hovered }: PressableState) => [
                  styles.tabButton,
                  tab === t ? styles.tabButtonActive : null,
                  hovered && tab !== t ? styles.tabButtonHover : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === t ? styles.tabTextActive : null,
                  ]}
                >
                  {t === 'featured' ? 'Featured' : 'My tactics'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Surface>

      <View style={styles.grid}>
        {(loading ? Array.from({ length: 6 }).map((_, idx) => ({ id: `s${idx}` })) : tacticsToRender).map(
          (tactic: any) => (
            <View key={tactic.id} style={styles.gridItem}>
              {!loading ? (
                <TacticCardWeb
                  tactic={tactic}
                  mapName={tactic.mapName}
                  saved={isSaved(tactic.id)}
                  onSave={() => toggleTactic(tactic)}
                  onPress={() => navigate(`/tactics/${tactic.id}`, { state: { mapId: selectedMapId } })}
                />
              ) : (
                <View style={styles.skeleton} />
              )}
            </View>
          ),
        )}
        {!loading && tacticsToRender.length === 0 ? (
          <Text style={styles.empty}>
            {tab === 'my'
              ? 'Save or build tactics to see them here.'
              : 'No tactics published for this map/side yet.'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  createButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  createButtonHover: {
    transform: [{ translateY: -1 }],
  },
  createButtonText: {
    color: '#0b0c10',
    fontWeight: '800',
  },
  mapScroller: {
    marginTop: spacing.md,
  },
  mapChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapChipHover: {
    borderColor: colors.primary,
  },
  mapChipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  mapChipText: {
    color: colors.text,
    fontWeight: '700',
  },
  mapChipTextActive: {
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tabButtonHover: {
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#0b0c10',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    flexBasis: '32%',
    minWidth: 260,
  },
  skeleton: {
    height: 260,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    color: colors.muted,
    fontWeight: '700',
  },
});
