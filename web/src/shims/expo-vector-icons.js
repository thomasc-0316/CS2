import React from 'react';
import { Text } from 'react-native';

const iconGlyph = '★';

function createIconComponent(defaultName) {
  return function Icon({ name = defaultName, size = 20, color = '#fff', style }) {
    return <Text style={[{ fontSize: size, color }, style]}>{iconGlyph}</Text>;
  };
}

export const Ionicons = createIconComponent('ionicon');
export default { Ionicons };
