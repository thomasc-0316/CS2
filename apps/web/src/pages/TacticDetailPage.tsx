import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Surface from '../components/Surface';
import SectionHeading from '../components/SectionHeading';
import TacticCardWeb from '../components/TacticCardWeb';
import LineupCardWeb from '../components/LineupCardWeb';
import { colors, radii, spacing } from '../theme/tokens';
import { getTacticById } from '@services/tacticService.js';
import { getFilteredLineups, getLineupById } from '@services/lineupService.js';
import { MAPS } from '@data/maps.js';
import { useTacticLibrary } from '@ctx/TacticLibraryContext.js';

type MapData = {
  id: string;
  name: string;
  isLocked?: boolean;
  isActiveDuty?: boolean;
};
type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function TacticDetailPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tacticId = params.tacticId || '';
  const { toggleTactic, isSaved } = useTacticLibrary();
  const [tactic, setTactic] = useState<any | null>(null);
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapFromState = (location.state as any)?.mapId;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getTacticById(tacticId);
        if (!cancelled) setTactic(data);
        if (data) {
          const ids = Array.isArray(data.lineupIds) ? data.lineupIds : [];
          if (ids.length) {
            const fetched = await Promise.all(ids.map((id: string) => getLineupById(id)));
            if (!cancelled) setLineups(fetched.filter(Boolean) as any[]);
          } else if (data.mapId && data.side) {
            const fetched = await getFilteredLineups(data.mapId, { side: data.side });
            if (!cancelled) setLineups(fetched || []);
          }
        }
      } catch (error) {
        console.error('Failed to load tactic', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (tacticId) load();
    return () => {
      cancelled = true;
    };
  }, [tacticId]);

  const maps = MAPS as MapData[];
  const map = useMemo(
    () => maps.find((m) => m.id === (tactic?.mapId || mapFromState)) || maps[0],
    [mapFromState, tactic?.mapId, maps],
  );

  if (loading) {
    return (
      <Surface>
        <Text style={styles.loading}>Loading tactic...</Text>
      </Surface>
    );
  }

  if (!tactic) {
    return (
      <Surface>
        <Text style={styles.loading}>Tactic not found.</Text>
      </Surface>
    );
  }

  const saved = isSaved(tactic.id);

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
          title={tactic.title}
          subtitle={`${map?.name || 'Map'} • ${(tactic.side || '').toUpperCase()}`}
          action={
            <Pressable
              onPress={() => toggleTactic(tactic)}
              style={({ hovered }: PressableState) => [
                styles.saveButton,
                saved ? styles.saveButtonActive : null,
                hovered && !saved ? styles.saveButtonHover : null,
              ]}
            >
              <Text style={[styles.saveText, saved ? styles.saveTextActive : null]}>
                {saved ? 'Saved' : 'Save tactic'}
              </Text>
            </Pressable>
          }
        />
        {tactic.description ? (
          <Text style={styles.description}>{tactic.description}</Text>
        ) : null}

        <View style={styles.heroCard}>
          <TacticCardWeb tactic={tactic} mapName={map?.name} saved={saved} onSave={() => toggleTactic(tactic)} />
        </View>

        <Text style={styles.sectionTitle}>Linked lineups</Text>
        <View style={styles.grid}>
          {(lineups.length ? lineups : []).map((lineup: any) => (
            <View key={lineup.id} style={styles.gridItem}>
              <LineupCardWeb
                lineup={lineup}
                onPress={() => navigate(`/lineups/${lineup.mapId || map?.id}/${lineup.id}`)}
              />
            </View>
          ))}
          {lineups.length === 0 ? (
            <Text style={styles.empty}>No linked lineups yet.</Text>
          ) : null}
        </View>
      </Surface>
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
  },
  heroCard: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
  empty: {
    color: colors.muted,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    fontWeight: '800',
  },
  saveTextActive: {
    color: '#0b0c10',
  },
  loading: {
    color: colors.muted,
    fontWeight: '700',
  },
});
