import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

type Props = {
  children: ReactNode;
  padding?: boolean;
  bleed?: boolean;
};

export default function Surface({ children, padding = true, bleed = false }: Props) {
  return (
    <View
      style={[
        styles.surface,
        padding ? styles.surfacePadding : null,
        bleed ? styles.surfaceBleed : null,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  surfacePadding: {
    padding: spacing.lg,
  },
  surfaceBleed: {
    overflow: 'hidden',
  },
});
