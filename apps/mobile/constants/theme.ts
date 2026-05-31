export const FS = {
  // Surface stack (dark theme — canonical)
  bg:          '#0a0a0a',
  surface:     '#141414',
  surfaceHigh: '#1e1e1e',
  border:      '#2a2a2a',

  // Text
  text:  '#f9f9f9',
  muted: '#6b7280',

  // Brand accent
  primary:      '#6366f1',
  primaryHover: '#818cf8',

  // Semantic status
  success: '#22c55e',
  warning: '#f59e0b',
  danger:  '#ef4444',

  // Macro palette
  protein: '#6366f1',
  carbs:   '#f59e0b',
  fat:     '#ec4899',

  // Radius scale
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    full: 999,
  },

  // Spacing (4px base)
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
} as const;

export type FSTheme = typeof FS;
