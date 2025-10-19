/**
 * Barrel export for TicketsAccountModal components
 * Provides clean imports for all components
 */

export { ModalHeader } from './ModalHeader';
export { default as BottomTabs } from './BottomTabs';
export { default as TicketList } from './TicketList';
export { default as MessageInput } from './MessageInput';
export { default as Messages } from './Messages';

// Re-export shared components for convenience
export {
  TypingIndicator,
  AvatarChangeIndicator,
  ReadReceipts,
} from '../../shared/components';
