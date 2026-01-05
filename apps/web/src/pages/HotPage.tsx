import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import Surface from '../components/Surface';
import LineupCardWeb from '../components/LineupCardWeb';
import { colors, spacing } from '../theme/tokens';
import { getHotLineups } from '@services/lineupService.js';
import { MAPS } from '@data/maps.js';

export default function HotPage() {
  const navigate = useNavigate();
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getHotLineups(30);
        if (!cancelled) setLineups(data || []);
      } catch (error) {
        console.error('Failed to load hot feed', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Surface>
      <SectionHeading
        title="Hot lineups"
        subtitle="Sorted by upvotes, refreshed live from Firestore."
      />
      <View style={styles.list}>
        {(loading ? Array.from({ length: 6 }).map((_, idx) => ({ id: `s${idx}` })) : lineups).map(
          (lineup: any, index: number) => (
            <View key={lineup.id} style={styles.item}>
              {!loading ? (
                <LineupCardWeb
                  lineup={lineup}
                  compact
                  rank={index + 1}
                  onPress={() =>
                    navigate(`/lineups/${lineup.mapId || MAPS[0]?.id || 'dust2'}/${lineup.id}`)
                  }
                />
              ) : (
                <View style={styles.skeleton} />
              )}
            </View>
          ),
        )}
        {!loading && lineups.length === 0 ? (
          <Text style={styles.empty}>Nothing is trending yet.</Text>
        ) : null}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  item: {},
  skeleton: {
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: spacing.md,
  },
});
