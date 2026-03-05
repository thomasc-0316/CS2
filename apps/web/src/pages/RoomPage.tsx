import { StyleSheet, Text, View } from 'react-native';
import Surface from '../components/Surface';
import { colors, spacing } from '../theme/tokens';

export default function RoomPage() {
  return (
    <Surface>
      <View style={styles.container}>
        <Text style={styles.title}>Live room</Text>
        <Text style={styles.subtitle}>
          The real-time room drafting experience stays on mobile for now. You can still manage
          tactics and lineups from desktop.
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  subtitle: {
    color: colors.muted,
  },
});
