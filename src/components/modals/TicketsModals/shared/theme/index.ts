/**
 * Design System for Tickets Modals
 * Centralized theme configuration for consistent styling
 */

export const TICKETS_THEME = {
  colors: {
    // Primary brand colors (Blue - for trust and reliability)
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

    // Success colors (Green - for resolved tickets)
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

    // Warning colors (Yellow/Amber - for pending/waiting)
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

    // Error colors (Red - for urgent/high priority)
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

    // Info colors (Cyan - for information)
    info: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },

    // Neutral colors (Slate - primary neutral)
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },

    // Gray colors (alternative neutral)
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

    // Ticket status colors
    ticketStatus: {
      open: '#22c55e',        // green
      'in progress': '#f59e0b', // amber
      closed: '#6b7280',       // gray
      pending: '#06b6d4',      // cyan
      waiting: '#fbbf24',      // yellow
    },

    // Priority colors
    priority: {
      high: '#ef4444',    // red
      medium: '#f59e0b',  // amber
      low: '#22c55e',     // green
      none: '#94a3b8',    // slate-400
    },

    // Tag colors (extended palette for ticket tags)
    tags: {
      red: '#ef4444',
      orange: '#f97316',
      amber: '#f59e0b',
      yellow: '#eab308',
      lime: '#84cc16',
      green: '#22c55e',
      emerald: '#10b981',
      teal: '#14b8a6',
      cyan: '#06b6d4',
      sky: '#0ea5e9',
      blue: '#3b82f6',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      purple: '#a855f7',
      fuchsia: '#d946ef',
      pink: '#ec4899',
      rose: '#f43f5e',
      slate: '#64748b',
      gray: '#6b7280',
    },
  },

  spacing: {
    // Consistent spacing scale (matches Tailwind)
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
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
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
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Component-specific theming
  components: {
    modal: {
      backdropOpacity: '0.5',
      backdropBlur: 'sm',
      borderRadius: '2xl',
      padding: '4',
      maxWidth: {
        sm: '28rem',   // 448px
        md: '32rem',   // 512px
        lg: '40rem',   // 640px
        xl: '48rem',   // 768px
        full: '100%',
      },
      sizes: {
        initial: {
          width: '400px',
          height: '750px',
        },
        half: {
          width: '50%',
          height: '83.33%', // 5/6
        },
        fullscreen: {
          width: '100%',
          height: '100%',
        },
      },
    },

    ticket: {
      listItemHeight: 'auto',
      messageMaxWidth: '80%',
      avatarSize: '1.25rem', // 20px
      badgeHeight: '1.5rem', // 24px
    },

    form: {
      inputHeight: '2.5rem',
      textareaMinHeight: '5rem',
      labelSpacing: '2',
      fieldSpacing: '4',
      sectionSpacing: '6',
    },

    button: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
      },
      paddingX: '4',
      paddingY: '2',
      borderRadius: 'lg',
      minTouchTarget: '44px', // WCAG accessibility
    },

    badge: {
      paddingX: '2.5',
      paddingY: '1',
      fontSize: 'xs',
      borderRadius: 'full',
    },
  },

  // Animation durations
  transitions: {
    fast: '150ms',
    normal: '200ms',
    medium: '300ms',
    slow: '500ms',
  },

  // Animation easing
  easing: {
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index layers
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 10000,
    modal: 10001,
    popover: 10002,
    tooltip: 10003,
  },
} as const;

// CSS Custom Properties for dynamic theming
export const CSS_CUSTOM_PROPERTIES = {
  // Primary colors
  '--tickets-primary-50': TICKETS_THEME.colors.primary[50],
  '--tickets-primary-500': TICKETS_THEME.colors.primary[500],
  '--tickets-primary-600': TICKETS_THEME.colors.primary[600],
  '--tickets-primary-700': TICKETS_THEME.colors.primary[700],

  // Status colors
  '--ticket-status-open': TICKETS_THEME.colors.ticketStatus.open,
  '--ticket-status-in-progress': TICKETS_THEME.colors.ticketStatus['in progress'],
  '--ticket-status-closed': TICKETS_THEME.colors.ticketStatus.closed,

  // Priority colors
  '--ticket-priority-high': TICKETS_THEME.colors.priority.high,
  '--ticket-priority-medium': TICKETS_THEME.colors.priority.medium,
  '--ticket-priority-low': TICKETS_THEME.colors.priority.low,

  // Spacing
  '--spacing-2': TICKETS_THEME.spacing[2],
  '--spacing-4': TICKETS_THEME.spacing[4],
  '--spacing-6': TICKETS_THEME.spacing[6],

  // Border radius
  '--radius-lg': TICKETS_THEME.borderRadius.lg,
  '--radius-xl': TICKETS_THEME.borderRadius.xl,
  '--radius-2xl': TICKETS_THEME.borderRadius['2xl'],

  // Transitions
  '--transition-fast': TICKETS_THEME.transitions.fast,
  '--transition-normal': TICKETS_THEME.transitions.normal,
} as const;

// Utility functions for theme access
export const getColor = (colorPath: string): string => {
  const keys = colorPath.split('.');
  let value: any = TICKETS_THEME.colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || TICKETS_THEME.colors.slate[500];
};

export const getSpacing = (size: keyof typeof TICKETS_THEME.spacing): string => {
  return TICKETS_THEME.spacing[size];
};

export const getStatusColor = (status?: string): string => {
  if (!status) return TICKETS_THEME.colors.slate[400];
  
  const normalizedStatus = status.toLowerCase();
  return TICKETS_THEME.colors.ticketStatus[normalizedStatus as keyof typeof TICKETS_THEME.colors.ticketStatus]
    || TICKETS_THEME.colors.slate[400];
};

export const getPriorityColor = (priority?: string | null): string => {
  if (!priority) return TICKETS_THEME.colors.priority.none;
  
  const normalizedPriority = priority.toLowerCase();
  return TICKETS_THEME.colors.priority[normalizedPriority as keyof typeof TICKETS_THEME.colors.priority]
    || TICKETS_THEME.colors.priority.none;
};

export const getTagColor = (color?: string): string => {
  if (!color) return TICKETS_THEME.colors.tags.blue;
  
  // If it's a hex color, return as-is
  if (color.startsWith('#')) return color;
  
  // Otherwise lookup from tags palette
  const normalizedColor = color.toLowerCase();
  return TICKETS_THEME.colors.tags[normalizedColor as keyof typeof TICKETS_THEME.colors.tags]
    || color;
};

// Glass morphism helper
export const getGlassMorphismClasses = (variant: 'light' | 'medium' | 'heavy' = 'medium'): string => {
  const variants = {
    light: 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-md',
    medium: 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl',
    heavy: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl',
  };
  
  return variants[variant];
};

// Border helper for glass morphism
export const getGlassBorderClasses = (): string => {
  return 'border border-white/20 dark:border-gray-700/20';
};
