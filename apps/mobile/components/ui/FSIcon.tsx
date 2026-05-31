import React from 'react';
import * as LucideIcons from 'lucide-react-native';

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function FSIcon({ name, size = 24, color = 'currentColor', strokeWidth = 2 }: Props) {
  const icons = LucideIcons as Record<string, React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>>;
  const Icon = icons[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
