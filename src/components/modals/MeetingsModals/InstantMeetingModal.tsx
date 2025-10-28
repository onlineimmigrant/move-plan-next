import React, { useState, useEffect } from 'react';
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
    }
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

  const handleMeetingTypeChange = (meetingTypeId: string) => {
    const selectedType = meetingTypes.find(mt => mt.id === meetingTypeId);
    setFormData(prev => ({
      ...prev,
      meeting_type_id: meetingTypeId,
      duration_minutes: selectedType?.duration_minutes || 30,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" style={{ color: primary.base }} />
            <h2 className="text-xl font-semibold text-gray-900">Send Instant Meeting Invite</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.meeting_type_id}
              onChange={(e) => handleMeetingTypeChange(e.target.value)}
              onFocus={() => setFocusedField('meeting_type')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              style={focusedField === 'meeting_type' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              required
              disabled={loading}
            >
              {meetingTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              style={focusedField === 'title' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              placeholder="Quick consultation"
              required
              disabled={loading}
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              onFocus={() => setFocusedField('customer_name')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              style={focusedField === 'customer_name' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          {/* Customer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              onFocus={() => setFocusedField('customer_email')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              style={focusedField === 'customer_email' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              placeholder="customer@example.com"
              required
              disabled={loading}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
              onFocus={() => setFocusedField('duration')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              style={focusedField === 'duration' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              min="15"
              max="480"
              step="15"
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none resize-none"
              style={focusedField === 'notes' ? {
                borderColor: primary.base,
                boxShadow: `0 0 0 3px ${primary.base}33`
              } : undefined}
              rows={3}
              placeholder="Additional information for the customer..."
              disabled={loading}
            />
          </div>

          {/* Info Notice */}
          <div 
            className="border rounded-md p-3"
            style={{
              backgroundColor: `${primary.base}0d`,
              borderColor: `${primary.base}33`
            }}
          >
            <p className="text-sm" style={{ color: primary.base }}>
              <strong>Note:</strong> This will create an instant meeting scheduled for now. 
              An invitation email with the meeting link will be sent immediately to the customer.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: loading ? undefined : (isHovered ? primary.hover : primary.base)
              }}
              disabled={loading}
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
