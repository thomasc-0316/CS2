// Lightweight shim mapping the Ionicons import shape to react-icons.
import type { ComponentType, CSSProperties } from 'react';
import * as IoniconsModule from 'react-icons/io5';

// Expo's @expo/vector-icons exports named icon sets (Ionicons, etc.).
// We only need Ionicons; export a component that matches the API: <Ionicons name="home" size={24} color="#fff" />
type IconProps = {
  name: keyof typeof IoniconsModule;
  size?: number;
  color?: string;
  style?: CSSProperties;
};

export function Ionicons({ name, size = 20, color = 'currentColor', style }: IconProps) {
  const IconComponent = IoniconsModule[name] as ComponentType<{
    size?: number;
    color?: string;
    style?: CSSProperties;
  }>;
  if (!IconComponent) {
    return null;
  }
  return <IconComponent size={size} color={color} style={style} />;
}

export default {
  Ionicons,
};
