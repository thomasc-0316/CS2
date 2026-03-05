import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function SectionHeading({ title, subtitle, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
});
