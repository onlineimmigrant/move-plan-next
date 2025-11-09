import React, { useRef, useEffect, InputHTMLAttributes, RefAttributes } from 'react';
import FocusTrap from 'focus-trap-react';
import { FaTimes } from 'react-icons/fa';
import Button from '@/ui/Button';
import { FIELD_LABELS } from '@/components/constants/profile';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';

interface PrimaryColors {
  base: string;
  lighter: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  editingField: string | null;
  fieldValue: string;
  formError: string | null;
  isSubmitting: boolean;
  primary: PrimaryColors;
  onFieldValueChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

// Reusable Input component - Memoized for performance
const Input = React.memo<InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement> & { focusRingColor?: string }>(
  ({ className = '', focusRingColor, ...props }, ref) => (
    <input
      ref={ref}
      className={`block w-full border border-gray-200 dark:border-gray-600 rounded-md py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-1 transition duration-150 ease-in-out placeholder-gray-400 dark:placeholder-gray-500 text-sm ${className}`}
      style={{ 
        ...(props.style || {}),
        '--focus-ring-color': focusRingColor 
      } as React.CSSProperties}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  editingField,
  fieldValue,
  formError,
  isSubmitting,
  primary,
  onFieldValueChange,
  onSubmit,
  onClose,
  onKeyDown,
}) => {
  const { t } = useAccountTranslations();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !editingField) return null;

  return (
    <FocusTrap>
      <div
        className="fixed bg-black/50 backdrop-blur-sm inset-0 z-50"
        onKeyDown={onKeyDown}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={modalRef}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.edit} {FIELD_LABELS[editingField] || editingField}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            {formError && (
              <div className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert" aria-live="polite">
                {formError}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="field_value"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {FIELD_LABELS[editingField] || editingField}
                </label>
                <Input
                  id="field_value"
                  type={editingField === 'email' ? 'email' : 'text'}
                  value={fieldValue}
                  onChange={(e) => onFieldValueChange(e.target.value)}
                  placeholder={`Enter ${FIELD_LABELS[editingField] || editingField}...`}
                  ref={inputRef}
                  focusRingColor={primary.base}
                  style={{
                    borderColor: primary.lighter,
                    outlineColor: primary.base
                  }}
                  className="focus:ring-1 focus:border-current"
                  aria-describedby="field_value_help"
                  required
                />
                <p id="field_value_help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editingField === 'email'
                    ? 'Enter a valid email address (e.g., user@example.com).'
                    : 'Provide the updated value for this field.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="Save changes"
                >
                  {isSubmitting ? `${t.loading}` : t.save}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400"
                  disabled={isSubmitting}
                  aria-label="Cancel"
                >
                  {t.cancel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};
