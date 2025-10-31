/**
 * Email Template Notification Component
 * Success and error message notifications
 */

import React from 'react';
import { EmailIcons } from './EmailIcons';

interface EmailNotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onDismiss: () => void;
}

export const EmailNotification: React.FC<EmailNotificationProps> = ({
  type,
  message,
  onDismiss,
}) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: EmailIcons.CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: EmailIcons.ExclamationCircle,
      iconColor: 'text-red-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: EmailIcons.Info,
      iconColor: 'text-blue-600',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-xl p-4 flex items-start gap-3 shadow-sm`}
    >
      <Icon className={`h-6 w-6 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
      <button
        onClick={onDismiss}
        className={`${style.text} hover:opacity-70 transition-opacity`}
      >
        <EmailIcons.X className="h-5 w-5" />
      </button>
    </div>
  );
};
