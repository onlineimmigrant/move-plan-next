import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserIcon } from '@heroicons/react/24/outline';

interface Admin {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  organization_id: string;
}

interface Mention {
  admin_id: string;
  admin_name: string;
  mention_text: string;
  position: number;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  onMention?: (adminId: string, adminName: string) => void;
  organizationId: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * MentionInput Component
 * 
 * Rich text input with @mention support and typeahead dropdown.
 * Automatically detects @ character and shows admin suggestions.
 * Supports keyboard navigation and click selection.
 * 
 * Features:
 * - Typeahead dropdown with fuzzy matching
 * - Keyboard navigation (up/down arrows, enter to select)
 * - Avatar display with fallback
 * - Real-time admin list from database
 * - Extract mentions on change for storage
 * - Visual mention highlighting (optional)
 */
export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  organizationId,
  placeholder = 'Type @ to mention an admin...',
  className = '',
  rows = 4,
  disabled = false,
  autoFocus = false,
}) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch admins from organization
  useEffect(() => {
    const fetchAdmins = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, organization_id')
        .eq('organization_id', organizationId)
        .eq('role', 'admin')
        .order('full_name');

      if (data && !error) {
        setAdmins(data);
      }
    };

    if (organizationId) {
      fetchAdmins();
    }
  }, [organizationId]);

  // Parse mentions from text
  const extractMentions = (text: string): Mention[] => {
    const mentions: Mention[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[1];
      // Find admin by name (case-insensitive)
      const admin = admins.find(
        (a) => a.full_name.toLowerCase().replace(/\s+/g, '') === mentionText.toLowerCase()
      );

      if (admin) {
        mentions.push({
          admin_id: admin.id,
          admin_name: admin.full_name,
          mention_text: `@${mentionText}`,
          position: match.index,
        });
      }
    }

    return mentions;
  };

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setCursorPosition(cursorPos);

    // Check if user just typed @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Show dropdown if @ is followed by word characters or empty
      if (/^\w*$/.test(textAfterAt)) {
        setMentionQuery(textAfterAt);
        setShowDropdown(true);
        setSelectedIndex(0);
        
        // Calculate dropdown position
        calculateDropdownPosition(lastAtIndex);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }

    // Extract mentions and notify parent
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = (atIndex: number) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeAt = value.substring(0, atIndex);
    
    // Simple approximation (can be improved with canvas measurement)
    const lines = textBeforeAt.split('\n').length;
    const lastLineLength = textBeforeAt.split('\n').pop()?.length || 0;
    
    const lineHeight = 24; // Approximate line height
    const charWidth = 8; // Approximate character width
    
    setDropdownPosition({
      top: lines * lineHeight,
      left: Math.min(lastLineLength * charWidth, 400), // Max 400px left
    });
  };

  // Filter admins based on mention query
  useEffect(() => {
    if (!mentionQuery) {
      setFilteredAdmins(admins.slice(0, 5)); // Show first 5 by default
    } else {
      const query = mentionQuery.toLowerCase();
      const filtered = admins.filter(
        (admin) =>
          admin.full_name.toLowerCase().includes(query) ||
          admin.email.toLowerCase().includes(query)
      );
      setFilteredAdmins(filtered.slice(0, 5)); // Max 5 suggestions
    }
  }, [mentionQuery, admins]);

  // Handle admin selection
  const selectAdmin = (admin: Admin) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Replace @query with @adminname
      const mentionText = admin.full_name.replace(/\s+/g, ''); // Remove spaces for mention
      const textBefore = value.substring(0, lastAtIndex);
      const textAfter = value.substring(cursorPosition);
      const newValue = `${textBefore}@${mentionText} ${textAfter}`;
      
      // Update value and cursor position
      const newCursorPos = lastAtIndex + mentionText.length + 2; // +2 for @ and space
      
      const mentions = extractMentions(newValue);
      onChange(newValue, mentions);
      
      // Notify parent about mention
      if (onMention) {
        onMention(admin.id, admin.full_name);
      }
      
      setShowDropdown(false);
      
      // Set cursor position after mention
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredAdmins.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (filteredAdmins[selectedIndex]) {
          selectAdmin(filteredAdmins[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
      />

      {/* Mention Dropdown */}
      {showDropdown && filteredAdmins.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          style={{
            top: dropdownPosition.top + 80, // Adjust based on textarea position
            left: dropdownPosition.left,
            minWidth: '280px',
          }}
        >
          {filteredAdmins.map((admin, index) => (
            <button
              key={admin.id}
              type="button"
              onClick={() => selectAdmin(admin)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
              }`}
            >
              {/* Avatar */}
              {admin.avatar_url ? (
                <img
                  src={admin.avatar_url}
                  alt={admin.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
              )}

              {/* Admin Info */}
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 text-sm">
                  {admin.full_name}
                </div>
                <div className="text-xs text-gray-500">{admin.email}</div>
              </div>

              {/* Role Badge */}
              {admin.role && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {admin.role}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-1 text-xs text-gray-500">
        Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">@</span>{' '}
        to mention an admin. Use arrow keys to navigate, Enter to select.
      </div>
    </div>
  );
};

export default MentionInput;
