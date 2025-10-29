/**
 * Shared Constants
 * Constants used across AI model management
 */

// ============================================================================
// Popular AI Models
// ============================================================================

export const POPULAR_MODELS = [
  { name: 'grok-3', endpoint: 'https://api.x.ai/v1/chat/completions', icon: '' },
  { name: 'grok-3-mini', endpoint: 'https://api.x.ai/v1/chat/completions', icon: '' },
  { name: 'grok-3-mini-fast', endpoint: 'https://api.x.ai/v1/chat/completions', icon: '' },
  { name: 'gpt-4o', endpoint: 'https://api.openai.com/v1/chat/completions', icon: '' },
  { name: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions', icon: '' },
  { name: 'o1', endpoint: 'https://api.openai.com/v1/chat/completions', icon: '' },
  { name: 'o1-mini', endpoint: 'https://api.openai.com/v1/chat/completions', icon: '' },
  { name: 'o3-mini', endpoint: 'https://api.openai.com/v1/chat/completions', icon: '' },
  { name: 'claude-3.5-sonnet', endpoint: 'https://api.anthropic.com/v1/messages', icon: '' },
  { name: 'claude-4-sonnet', endpoint: 'https://api.anthropic.com/v1/messages', icon: '' },
  { name: 'claude-3.7-sonnet', endpoint: 'https://api.anthropic.com/v1/messages', icon: '' },
  { name: 'claude-3-opus', endpoint: 'https://api.anthropic.com/v1/messages', icon: '' },
  { name: 'deepseek-r1', endpoint: 'https://api.deepseek.com/v1/chat/completions', icon: '' },
  { name: 'deepseek-v3', endpoint: 'https://api.deepseek.com/v1/chat/completions', icon: '' },
  { name: 'deepseek-r1-0528', endpoint: 'https://api.deepseek.com/v1/chat/completions', icon: '' },
  { name: 'mistral-large-2', endpoint: 'https://api.mistral.ai/v1/chat/completions', icon: '' },
  { name: 'mistral-small-3.1', endpoint: 'https://api.mistral.ai/v1/chat/completions', icon: '' },
  { name: 'mixtral-8x7b', endpoint: 'https://api.mistral.ai/v1/chat/completions', icon: '' },
  { name: 'llama-4-scout', endpoint: 'https://api.together.xyz/v1/chat/completions', icon: '' },
  { name: 'llama-4-maverick', endpoint: 'https://api.together.xyz/v1/chat/completions', icon: '' },
  { name: 'llama-3.3', endpoint: 'https://api.together.xyz/v1/chat/completions', icon: '' },
  { name: 'llama-3-70b', endpoint: 'https://api.together.xyz/v1/chat/completions', icon: '' },
  { name: 'gemini-2.0-flash', endpoint: 'https://generativelanguage.googleapis.com/v1/models', icon: '' },
  { name: 'gemini-2.5-pro', endpoint: 'https://generativelanguage.googleapis.com/v1/models', icon: '' },
  { name: 'gemini-1.5-pro', endpoint: 'https://generativelanguage.googleapis.com/v1/models', icon: '' },
  { name: 'gemma-2', endpoint: 'https://generativelanguage.googleapis.com/v1/models', icon: '' },
  { name: 'vicuna-13b', endpoint: 'https://api.together.xyz/v1/chat/completions', icon: '' },
  { name: 'mistral-7b', endpoint: 'https://api.mistral.ai/v1/chat/completions', icon: '' },
] as const;

// ============================================================================
// Popular API Endpoints
// ============================================================================

export const POPULAR_ENDPOINTS = [
  { name: 'X AI (Grok)', url: 'https://api.x.ai/v1/chat/completions' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
  { name: 'Anthropic (Claude)', url: 'https://api.anthropic.com/v1/messages' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1/chat/completions' },
  { name: 'Mistral AI', url: 'https://api.mistral.ai/v1/chat/completions' },
  { name: 'Google (Gemini)', url: 'https://generativelanguage.googleapis.com/v1/models' },
  { name: 'Together AI', url: 'https://api.together.xyz/v1/chat/completions' },
] as const;

// ============================================================================
// Note: PREDEFINED_ROLES has been moved to types/aiManagement.ts
// Import it from there: import { PREDEFINED_ROLES } from '../types/aiManagement';
// ============================================================================

// ============================================================================
// Modal Animation Styles
// ============================================================================

export const MODAL_ANIMATION_STYLES = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInFromTop {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInFromBottom {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-in {
    animation: fadeIn 0.3s ease-out;
  }

  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .slide-in-from-top-2 {
    animation: slideInFromTop 0.3s ease-out;
  }

  .slide-in-from-bottom {
    animation: slideInFromBottom 0.3s ease-out;
  }
`;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_MAX_TOKENS = 200;
export const MIN_MAX_TOKENS = 1;
export const MAX_MAX_TOKENS = 100000;

export const DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant.';

export const DEFAULT_MODEL_FORM_DATA = {
  name: '',
  api_key: '',
  endpoint: '',
  max_tokens: DEFAULT_MAX_TOKENS,
  user_role_to_access: 'user',
  system_message: DEFAULT_SYSTEM_MESSAGE,
  icon: '',
  role: null,
  task: null,
  is_active: true,
};

// Alias for better naming
export const DEFAULT_VALUES = DEFAULT_MODEL_FORM_DATA;

// ============================================================================
// Auto-dismiss Delays
// ============================================================================

export const NOTIFICATION_DISMISS_DELAY = 5000; // 5 seconds
export const SUCCESS_MESSAGE_DELAY = 5000; // 5 seconds

// ============================================================================
// Validation Limits
// ============================================================================

export const VALIDATION_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  API_KEY_MIN_LENGTH: 10,
  SYSTEM_MESSAGE_MAX_LENGTH: 5000,
  ROLE_MAX_LENGTH: 100,
} as const;
