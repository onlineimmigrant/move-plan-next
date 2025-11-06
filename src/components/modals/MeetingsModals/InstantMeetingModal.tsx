import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MeetingType {
  id: string;
  name: string;
  duration_minutes: number;
}

interface InstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InstantMeetingModal({ isOpen, onClose, onSuccess }: InstantMeetingModalProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [loading, setLoading] = useState(false);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLSelectElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
  const [formData, setFormData] = useState({
    meeting_type_id: '',
    customer_email: '',
    customer_name: '',
    title: '',
    duration_minutes: 30,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadMeetingTypes();
      // Focus first field when modal opens
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'select, input, textarea, button:not(:disabled)'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const loadMeetingTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data, error } = await supabase
          .from('meeting_types')
          .select('id, name, duration_minutes')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setMeetingTypes(data || []);

        // Set default meeting type
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            meeting_type_id: data[0].id,
            duration_minutes: data[0].duration_minutes,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading meeting types:', error);
      toast.error('Failed to load meeting types');
    }
  };

  const handleMeetingTypeChange = (typeId: string) => {
    const selectedType = meetingTypes.find(t => t.id === typeId);
    if (selectedType) {
      // Only auto-fill title if it's empty or matches a previous type name
      const shouldAutoFillTitle = 
        formData.title === '' || 
        meetingTypes.some(t => t.name === formData.title);
      
      setFormData({
        ...formData,
        meeting_type_id: typeId,
        title: shouldAutoFillTitle ? selectedType.name : formData.title,
        duration_minutes: selectedType.duration_minutes
      });
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meeting_type_id || !formData.customer_email || !formData.customer_name || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/meetings/instant-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create instant meeting');
      }

      toast.success('Instant meeting created and invitation sent!');
      
      // Reset form
      setFormData({
        meeting_type_id: meetingTypes[0]?.id || '',
        customer_email: '',
        customer_name: '',
        title: '',
        duration_minutes: meetingTypes[0]?.duration_minutes || 30,
        notes: '',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating instant meeting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create instant meeting');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="instant-meeting-title"
        aria-modal="true"
        aria-describedby="instant-meeting-description"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !loading) {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" style={{ color: primary.base }} />
            <h2 id="instant-meeting-title" className="text-xl font-semibold text-gray-900 dark:text-white">Send Instant Meeting Invite</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white/20 dark:bg-gray-900/20">
          {/* Meeting Type */}
          <div>
            <label htmlFor="meeting-type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Meeting Type <span className="text-red-500" aria-label="required">*</span>
            </label>
            <select
              ref={firstFocusableRef}
              id="meeting-type"
              value={formData.meeting_type_id}
              onChange={(e) => handleMeetingTypeChange(e.target.value)}
              onFocus={() => setFocusedField('meeting_type')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
              style={focusedField === 'meeting_type' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}20`
              } : undefined}
              required
              disabled={loading}
              aria-required="true"
            >
              <option value="">Select a meeting type</option>
              {meetingTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Title */}
          <div>
            <label htmlFor="meeting-title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Meeting Title <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="meeting-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={focusedField === 'title' ? {
                borderColor: errors.title ? '#fca5a5' : primary.base,
                boxShadow: `0 0 0 3px ${errors.title ? '#fee2e2' : `${primary.base}20`}`
              } : undefined}
              placeholder="e.g., Quick consultation"
              disabled={loading}
              autoComplete="off"
              aria-required="true"
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Duration <span className="text-red-500" aria-label="required">*</span>
            </label>
            <select
              id="duration"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              onFocus={() => setFocusedField('duration')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white"
              style={focusedField === 'duration' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}20`
              } : undefined}
              disabled={loading}
              aria-required="true"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Customer Name <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="customer-name"
              type="text"
              value={formData.customer_name}
              onChange={(e) => {
                setFormData({ ...formData, customer_name: e.target.value });
                if (errors.customer_name) setErrors({ ...errors, customer_name: '' });
              }}
              onFocus={() => setFocusedField('customer_name')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.customer_name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={focusedField === 'customer_name' ? {
                borderColor: errors.customer_name ? '#fca5a5' : primary.base,
                boxShadow: `0 0 0 3px ${errors.customer_name ? '#fee2e2' : `${primary.base}20`}`
              } : undefined}
              placeholder="John Doe"
              disabled={loading}
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.customer_name ? 'true' : 'false'}
              aria-describedby={errors.customer_name ? 'name-error' : undefined}
            />
            {errors.customer_name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.customer_name}</p>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Customer Email <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="customer-email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => {
                setFormData({ ...formData, customer_email: e.target.value });
                if (errors.customer_email) setErrors({ ...errors, customer_email: '' });
              }}
              onFocus={() => setFocusedField('customer_email')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.customer_email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={focusedField === 'customer_email' ? {
                borderColor: errors.customer_email ? '#fca5a5' : primary.base,
                boxShadow: `0 0 0 3px ${errors.customer_email ? '#fee2e2' : `${primary.base}20`}`
              } : undefined}
              placeholder="customer@example.com"
              disabled={loading}
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-invalid={errors.customer_email ? 'true' : 'false'}
              aria-describedby={errors.customer_email ? 'email-error' : undefined}
            />
            {errors.customer_email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.customer_email}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="meeting-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              id="meeting-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none resize-none transition-all bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              style={focusedField === 'notes' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}20`
              } : undefined}
              rows={3}
              placeholder="Additional information for the customer..."
              disabled={loading}
            />
          </div>

          {/* Info text */}
          <p id="instant-meeting-description" className="text-xs text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-gray-800/20 rounded-lg p-2.5 backdrop-blur-sm">
            The meeting invitation will be sent immediately to the customer's email.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm transition-colors min-h-[44px]"
              disabled={loading}
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
            <button
              ref={lastFocusableRef}
              type="submit"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex-1 px-4 py-2.5 text-white rounded-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] backdrop-blur-sm"
              style={{
                backgroundColor: loading ? undefined : (isHovered ? primary.hover : primary.base)
              }}
              disabled={loading}
              aria-label={loading ? 'Sending meeting invitation' : 'Send meeting invitation'}
              aria-live="polite"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
