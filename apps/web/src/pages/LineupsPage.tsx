import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import Surface from '../components/Surface';
import LineupCardWeb from '../components/LineupCardWeb';
import Pill from '../components/Pill';
import { colors, radii, spacing } from '../theme/tokens';
import { MAPS } from '@data/maps.js';
import { getFilteredLineups } from '@services/lineupService.js';

const sides = ['All', 'T', 'CT'];
const sites = ['All', 'A', 'Mid', 'B'];
const nadeTypes = ['All', 'Smoke', 'Flash', 'Molotov', 'HE'];

type MapData = {
  id: string;
  name: string;
  isLocked?: boolean;
  isActiveDuty?: boolean;
};

export default function LineupsPage() {
  const params = useParams();
  const maps = MAPS as MapData[];
  const mapId = params.mapId || maps[0]?.id || 'dust2';
  const map = maps.find((m) => m.id === mapId) || maps[0];
  const navigate = useNavigate();

  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState('All');
  const [site, setSite] = useState('All');
  const [nadeType, setNadeType] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchLineups = async () => {
      try {
        setLoading(true);
        const data = await getFilteredLineups(mapId, {});
        if (!cancelled) setLineups(data || []);
      } catch (error) {
        console.error('Error loading lineups', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLineups();
    return () => {
      cancelled = true;
    };
  }, [mapId]);

  const filtered = useMemo(() => {
    return lineups.filter((lineup) => {
      const matchesSearch =
        !search ||
        (lineup.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (lineup.description || '').toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const matchesSide = side === 'All' || (lineup.side || '').toUpperCase() === side;
      const matchesSite = site === 'All' || (lineup.site || '').toUpperCase() === site.toUpperCase();
      const matchesNade =
        nadeType === 'All' || (lineup.nadeType || '').toLowerCase() === nadeType.toLowerCase();
      return matchesSide && matchesSite && matchesNade;
    });
  }, [lineups, side, site, nadeType, search]);

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <SectionHeading
            title={`${map?.name || 'Map'} lineups`}
            subtitle="Desktop-first grid with fast filters."
          />
          <Text style={styles.meta}>
            {lineups.length} total • {filtered.length} visible
          </Text>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search lineups..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Surface>
        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Side</Text>
            <View style={styles.pillRow}>
              {sides.map((s) => (
                <Pill key={s} label={s} active={side === s} onPress={() => setSide(s)} />
              ))}
            </View>
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Site</Text>
            <View style={styles.pillRow}>
              {sites.map((s) => (
                <Pill key={s} label={s} active={site === s} onPress={() => setSite(s)} />
              ))}
            </View>
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Grenade</Text>
            <View style={styles.pillRow}>
              {nadeTypes.map((s) => (
                <Pill key={s} label={s} active={nadeType === s} onPress={() => setNadeType(s)} />
              ))}
            </View>
          </View>
        </View>
      </Surface>

      <View style={styles.grid}>
        {(loading ? Array.from({ length: 8 }).map((_, idx) => ({ id: `s${idx}` })) : filtered).map(
          (lineup: any) => (
            <View key={lineup.id} style={styles.gridItem}>
              {!loading ? (
                <LineupCardWeb
                  lineup={lineup}
                  onPress={() => navigate(`/lineups/${mapId}/${lineup.id}`)}
                />
              ) : (
                <View style={styles.skeleton} />
              )}
            </View>
          ),
        )}
        {!loading && filtered.length === 0 ? (
          <Text style={styles.empty}>No lineups match these filters.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  meta: {
    color: colors.muted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  search: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    minWidth: 240,
  },
  filters: {
    gap: spacing.md,
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    height: 240,
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
