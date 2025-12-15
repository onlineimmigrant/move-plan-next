'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSettings } from '@/context/SettingsContext';
import { 
  Users, 
  Search,
  X,
  UserPlus,
  Mail,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface Contact {
  id: string;
  full_name: string;
  email: string;
  customer?: {
    company_name?: string;
    is_customer?: boolean;
    is_lead?: boolean;
  };
}

interface Recipient {
  email: string;
  name?: string;
  contact_id?: number;
}

interface RecipientSelectorProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  primary: { base: string; hover: string };
}

export default function RecipientSelector({ recipients, onRecipientsChange, primary }: RecipientSelectorProps) {
  const { settings } = useSettings();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    if (settings?.organization_id && showContactList) {
      fetchContacts();
    }
  }, [settings?.organization_id, showContactList]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with customer data (customers and leads)
      // Use JSONB operators to filter customer field
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, customer')
        .eq('organization_id', settings!.organization_id)
        .not('customer', 'is', null)
        .not('email', 'is', null)
        .or('customer->>is_customer.eq.true,customer->>is_lead.eq.true')
        .order('full_name')
        .limit(100);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = (contact: Contact) => {
    if (recipients.some((r) => r.email === contact.email)) return;

    onRecipientsChange([
      ...recipients,
      {
        email: contact.email,
        name: contact.full_name,
        contact_id: undefined,
      },
    ]);
    setShowContactList(false);
  };

  const addManualEmail = () => {
    const email = manualEmail.trim();
    if (!email || !email.includes('@')) return;
    if (recipients.some((r) => r.email === email)) return;

    onRecipientsChange([
      ...recipients,
      { email, name: undefined, contact_id: undefined },
    ]);
    setManualEmail('');
  };

  const removeRecipient = (email: string) => {
    onRecipientsChange(recipients.filter((r) => r.email !== email));
  };

  const filteredContacts = contacts.filter(
    (contact) => !recipients.some((r) => r.email === contact.email)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Recipients
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Add contacts from your CRM or enter email addresses manually
        </p>
      </div>

      {/* Manual Email Input */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Mail className="w-4 h-4" />
          Add Email Address
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addManualEmail()}
            placeholder="recipient@example.com"
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            onClick={addManualEmail}
            disabled={!manualEmail.trim() || !manualEmail.includes('@')}
            className="px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Browse Contacts */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Users className="w-4 h-4" />
            Browse CRM Contacts
          </label>
          <button
            onClick={() => setShowContactList(!showContactList)}
            className="text-sm text-primary hover:underline"
          >
            {showContactList ? 'Hide' : 'Show'} Contacts
          </button>
        </div>

        {showContactList && (
          <div className="space-y-3">
            {/* Contact List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => addContact(contact)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${primary.base}1A`
                        }}
                      >
                        <span className="text-sm font-semibold"
                          style={{ color: primary.base }}
                        >
                          {contact.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contact.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {contact.email}
                        </p>
                        {contact.customer?.company_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {contact.customer.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <UserPlus className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                  No contacts available. Add customers or leads in the CRM modal.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Recipients */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <CheckCircle2 className="w-4 h-4" />
          Selected Recipients ({recipients.length})
        </label>

        {recipients.length > 0 ? (
          <div className="space-y-2">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    {recipient.name && (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {recipient.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {recipient.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeRecipient(recipient.email)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No recipients selected yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
