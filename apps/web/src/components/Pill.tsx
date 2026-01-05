import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type PressableStateCallbackType } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
};

type PressableState = PressableStateCallbackType & { hovered?: boolean };

export default function Pill({ label, active, onPress, icon }: Props) {
  const content = (
    <>
      {icon}
      <Text style={[styles.text, active ? styles.textActive : null]}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <Pressable style={[styles.pill, active && styles.active]}>{content}</Pressable>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: PressableState) => [
        styles.pill,
        active && styles.active,
        hovered && !active ? styles.hover : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  hover: {
    borderColor: colors.primary,
  },
  text: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  textActive: {
    color: colors.text,
  },
});
