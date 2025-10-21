/**
 * Design System for Meetings Modals
 * Centralized theme configuration for consistent styling
 */

export const MEETINGS_THEME = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // primary
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Secondary colors
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // secondary
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },

    // Accent colors
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // accent
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Semantic colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },

    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Meeting type colors (can be customized per organization)
    meetingTypes: {
      default: '#3b82f6',
      consultation: '#10b981',
      review: '#f59e0b',
      workshop: '#8b5cf6',
      followUp: '#ef4444',
      strategy: '#06b6d4',
      training: '#84cc16',
      other: '#6b7280',
    },
  },

  spacing: {
    // Consistent spacing scale
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Component-specific theming
  components: {
    modal: {
      backdropOpacity: '0.5',
      borderRadius: 'lg',
      padding: '6',
      maxWidth: {
        sm: '24rem',   // 384px
        md: '32rem',   // 512px
        lg: '48rem',   // 768px
        xl: '64rem',   // 1024px
        full: '100%',
      },
    },

    calendar: {
      headerHeight: '3rem',
      dayHeight: '6rem',
      eventHeight: '1.5rem',
      borderRadius: 'md',
    },

    form: {
      inputHeight: '2.5rem',
      labelSpacing: '2',
      fieldSpacing: '4',
      sectionSpacing: '6',
    },

    button: {
      height: '2.5rem',
      paddingX: '4',
      paddingY: '2',
      borderRadius: 'md',
    },
  },

  // Animation durations
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// CSS Custom Properties for dynamic theming
export const CSS_CUSTOM_PROPERTIES = {
  // Primary colors
  '--meetings-primary-50': MEETINGS_THEME.colors.primary[50],
  '--meetings-primary-500': MEETINGS_THEME.colors.primary[500],
  '--meetings-primary-600': MEETINGS_THEME.colors.primary[600],
  '--meetings-primary-700': MEETINGS_THEME.colors.primary[700],

  // Meeting type colors
  '--meeting-type-default': MEETINGS_THEME.colors.meetingTypes.default,
  '--meeting-type-consultation': MEETINGS_THEME.colors.meetingTypes.consultation,
  '--meeting-type-review': MEETINGS_THEME.colors.meetingTypes.review,
  '--meeting-type-workshop': MEETINGS_THEME.colors.meetingTypes.workshop,
  '--meeting-type-follow-up': MEETINGS_THEME.colors.meetingTypes.followUp,
  '--meeting-type-strategy': MEETINGS_THEME.colors.meetingTypes.strategy,
  '--meeting-type-training': MEETINGS_THEME.colors.meetingTypes.training,
  '--meeting-type-other': MEETINGS_THEME.colors.meetingTypes.other,

  // Spacing
  '--spacing-1': MEETINGS_THEME.spacing[1],
  '--spacing-2': MEETINGS_THEME.spacing[2],
  '--spacing-3': MEETINGS_THEME.spacing[3],
  '--spacing-4': MEETINGS_THEME.spacing[4],
  '--spacing-6': MEETINGS_THEME.spacing[6],

  // Border radius
  '--radius-md': MEETINGS_THEME.borderRadius.md,
  '--radius-lg': MEETINGS_THEME.borderRadius.lg,

  // Transitions
  '--transition-normal': MEETINGS_THEME.transitions.normal,
} as const;

// Utility functions for theme access
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = MEETINGS_THEME.colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || MEETINGS_THEME.colors.gray[500];
};

export const getSpacing = (size: keyof typeof MEETINGS_THEME.spacing) => {
  return MEETINGS_THEME.spacing[size];
};

export const getMeetingTypeColor = (type?: string) => {
  if (!type) return MEETINGS_THEME.colors.meetingTypes.default;

  const normalizedType = type.toLowerCase().replace(/\s+/g, '');
  return MEETINGS_THEME.colors.meetingTypes[normalizedType as keyof typeof MEETINGS_THEME.colors.meetingTypes]
    || MEETINGS_THEME.colors.meetingTypes.default;
};