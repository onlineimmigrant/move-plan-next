/**
 * Constants and enums for Tickets Modals
 * Centralized configuration for consistent behavior across components
 */

// ============================================================================
// TICKET STATUSES
// ============================================================================

export const TICKET_STATUSES = {
  ALL: 'all',
  OPEN: 'open',
  IN_PROGRESS: 'in progress',
  CLOSED: 'closed',
  PENDING: 'pending',
  WAITING: 'waiting',
} as const;

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUSES.ALL]: 'All Tickets',
  [TICKET_STATUSES.OPEN]: 'Open',
  [TICKET_STATUSES.IN_PROGRESS]: 'In Progress',
  [TICKET_STATUSES.CLOSED]: 'Closed',
  [TICKET_STATUSES.PENDING]: 'Pending',
  [TICKET_STATUSES.WAITING]: 'Waiting',
} as const;

// ============================================================================
// TICKET PRIORITIES
// ============================================================================

export const TICKET_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none',
} as const;

export const TICKET_PRIORITY_LABELS = {
  [TICKET_PRIORITIES.HIGH]: 'High',
  [TICKET_PRIORITIES.MEDIUM]: 'Medium',
  [TICKET_PRIORITIES.LOW]: 'Low',
  [TICKET_PRIORITIES.NONE]: 'None',
} as const;

// ============================================================================
// MODAL VIEW STATES
// ============================================================================

export const MODAL_VIEWS = {
  LIST: 'list',
  DETAIL: 'detail',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const;

export const MODAL_SIZES = {
  INITIAL: 'initial',
  HALF: 'half',
  FULLSCREEN: 'fullscreen',
} as const;

// ============================================================================
// PAGINATION & LOADING
// ============================================================================

export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  LOAD_MORE_THRESHOLD: 3, // Load more when 3 items from bottom
  MAX_TICKETS_PER_FETCH: 60, // Fetch 3 pages worth
} as const;

// ============================================================================
// DEBOUNCE DELAYS
// ============================================================================

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,              // Search input debounce
  TYPING_INDICATOR: 1000,   // Show typing indicator after 1s
  AUTO_SAVE: 2000,          // Auto-save delay
  FILTER_UPDATE: 200,       // Filter changes
} as const;

// ============================================================================
// REAL-TIME UPDATES
// ============================================================================

export const REALTIME = {
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  TYPING_TIMEOUT: 3000,      // Stop showing typing after 3s
} as const;

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.txt', '.csv',
  ],
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  SUBJECT: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 10000,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  TAG_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
  },
  NOTE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5000,
  },
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
  SCROLL_DEBOUNCE: 100,
  MESSAGE_MAX_LENGTH_PREVIEW: 100,
  AVATAR_SIZE: 20, // pixels
  
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    FILE_TOO_LARGE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE_MB}MB`,
    INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file.',
    TOO_MANY_FILES: `Maximum ${FILE_UPLOAD.MAX_FILES} files allowed`,
  },
  
  SUCCESS_MESSAGES: {
    TICKET_CREATED: 'Ticket created successfully',
    TICKET_UPDATED: 'Ticket updated successfully',
    TICKET_CLOSED: 'Ticket closed successfully',
    MESSAGE_SENT: 'Message sent successfully',
    FILE_UPLOADED: 'File uploaded successfully',
    NOTE_ADDED: 'Note added successfully',
    TAG_ADDED: 'Tag added successfully',
    ASSIGNMENT_UPDATED: 'Ticket assigned successfully',
  },
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  CLOSE_MODAL: 'Escape',
  SUBMIT_MESSAGE: 'Control+Enter', // or Command+Enter on Mac
  SEARCH_FOCUS: '/',
  NAVIGATE_UP: 'ArrowUp',
  NAVIGATE_DOWN: 'ArrowDown',
  SELECT_TICKET: 'Enter',
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  MODAL_SIZE: 'tickets_modal_size',
  SELECTED_AVATAR: 'admin_selected_avatar_id',
  FILTERS: 'tickets_filters',
  SORT_PREFERENCE: 'tickets_sort',
  VIEW_PREFERENCE: 'tickets_view',
  ANALYTICS_TIMEFRAME: 'tickets_analytics_timeframe',
} as const;

// ============================================================================
// ANALYTICS
// ============================================================================

export const ANALYTICS = {
  TIMEFRAMES: ['today', '7days', '30days', '90days', 'all'] as const,
  TIMEFRAME_LABELS: {
    today: 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '90days': 'Last 90 Days',
    all: 'All Time',
  },
  REFRESH_INTERVAL: 60000, // 1 minute
} as const;

// ============================================================================
// SORT OPTIONS
// ============================================================================

export const SORT_OPTIONS = {
  DATE_NEWEST: 'date_newest',
  DATE_OLDEST: 'date_oldest',
  PRIORITY: 'priority',
  UPDATED: 'recently_updated',
  RESPONSE_COUNT: 'response_count',
} as const;

export const SORT_LABELS = {
  [SORT_OPTIONS.DATE_NEWEST]: 'Newest First',
  [SORT_OPTIONS.DATE_OLDEST]: 'Oldest First',
  [SORT_OPTIONS.PRIORITY]: 'Priority',
  [SORT_OPTIONS.UPDATED]: 'Recently Updated',
  [SORT_OPTIONS.RESPONSE_COUNT]: 'Most Responses',
} as const;

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const ACCESSIBILITY = {
  ANNOUNCEMENT_DELAY: 100, // ms before announcing
  MIN_TOUCH_TARGET: 44, // pixels (WCAG 2.1 Level AAA)
  FOCUS_VISIBLE_OUTLINE: '2px solid',
  ARIA_LIVE_DURATION: 5000, // Duration to show ARIA live announcements
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TicketStatus = typeof TICKET_STATUSES[keyof typeof TICKET_STATUSES];
export type TicketPriority = typeof TICKET_PRIORITIES[keyof typeof TICKET_PRIORITIES];
export type ModalView = typeof MODAL_VIEWS[keyof typeof MODAL_VIEWS];
export type ModalSize = typeof MODAL_SIZES[keyof typeof MODAL_SIZES];
export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];
export type AnalyticsTimeframe = typeof ANALYTICS.TIMEFRAMES[number];
