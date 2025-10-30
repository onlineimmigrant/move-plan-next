import React from 'react';

interface PasswordStrengthProps {
  password: string;
  showIndicator?: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'bg-gray-300',
      suggestions: [],
    };
  }

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Mix uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  // Common patterns check (reduce score)
  const commonPatterns = ['123', 'abc', 'password', 'qwerty'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid common patterns');
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, Math.floor(score * 0.8)));

  let label = '';
  let color = '';

  switch (score) {
    case 0:
    case 1:
      label = 'Weak';
      color = 'bg-red-500';
      break;
    case 2:
      label = 'Fair';
      color = 'bg-yellow-500';
      break;
    case 3:
      label = 'Good';
      color = 'bg-blue-500';
      break;
    case 4:
      label = 'Strong';
      color = 'bg-green-500';
      break;
  }

  return { score, label, color, suggestions };
}

export default function PasswordStrengthIndicator({
  password,
  showIndicator = true,
}: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password);

  if (!showIndicator || !password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      {strength.label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Password strength: <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
          </span>
        </div>
      )}

      {/* Suggestions */}
      {strength.suggestions.length > 0 && strength.score < 3 && (
        <div className="text-xs text-gray-500 space-y-1">
          {strength.suggestions.slice(0, 2).map((suggestion, index) => (
            <div key={index} className="flex items-start gap-1">
              <span className="text-gray-400">•</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
