/**
 * Barrel export for TicketsAccountModal hooks
 * Provides clean imports for all custom hooks
 */

export { useTicketData } from './useTicketData';
export { useRealtimeSubscription } from './useRealtimeSubscription';
export { useMessageHandling } from './useMessageHandling';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useMarkAsReadEffects } from './useMarkAsReadEffects';

// Re-export shared hooks for convenience
export {
  useAutoResizeTextarea,
  useTypingIndicator,
  useAutoScroll,
  useFileUpload,
} from '../../shared/hooks';
