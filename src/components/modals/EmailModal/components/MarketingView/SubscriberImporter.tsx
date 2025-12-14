'use client';

import React, { useState, useRef } from 'react';
import { useSubscribers } from '../../hooks/useSubscribers';
import { useEmailLists } from '../../hooks/useEmailLists';
import { 
  Upload,
  UserPlus,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Trash2
} from 'lucide-react';

interface Subscriber {
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
}

interface SubscriberImporterProps {
  primary: { base: string; hover: string };
}

export default function SubscriberImporter({ primary }: SubscriberImporterProps) {
  const { subscribers, fetchSubscribers, addSubscriber, addSubscribers, deleteSubscriber } = useSubscribers();
  const { lists } = useEmailLists();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [csvData, setCsvData] = useState<Subscriber[]>([]);
  const [importStats, setImportStats] = useState<{
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  
  // Manual add form
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addingManually, setAddingManually] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return;

    // Assume first line is headers
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const emailIndex = headers.findIndex((h) => h.includes('email'));
    const firstNameIndex = headers.findIndex((h) => h.includes('first') && h.includes('name'));
    const lastNameIndex = headers.findIndex((h) => h.includes('last') && h.includes('name'));

    if (emailIndex === -1) {
      alert('CSV must contain an email column');
      return;
    }

    const parsed: Subscriber[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const email = values[emailIndex];
      
      if (email && email.includes('@')) {
        parsed.push({
          email,
          first_name: firstNameIndex >= 0 ? values[firstNameIndex] || undefined : undefined,
          last_name: lastNameIndex >= 0 ? values[lastNameIndex] || undefined : undefined,
          status: 'active',
        });
      }
    }

    setCsvData(parsed);
  };

  const handleImport = async () => {
    if (!selectedListId || csvData.length === 0) return;

    setImporting(true);
    setImportStats(null);

    const result = await addSubscribers(selectedListId, csvData);
    
    if (result) {
      setImportStats({
        success: csvData.length,
        duplicates: 0,
        errors: 0,
      });
      setCsvData([]);
      await fetchSubscribers(selectedListId);
    }

    setImporting(false);
  };

  const handleManualAdd = async () => {
    if (!selectedListId || !email) return;

    setAddingManually(true);
    const result = await addSubscriber(selectedListId, {
      email,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      status: 'active',
    });

    if (result) {
      setEmail('');
      setFirstName('');
      setLastName('');
      await fetchSubscribers(selectedListId);
    }

    setAddingManually(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Remove this subscriber?')) {
      await deleteSubscriber(id);
      if (selectedListId) {
        await fetchSubscribers(selectedListId);
      }
    }
  };

  const handleListChange = async (listId: number) => {
    setSelectedListId(listId);
    await fetchSubscribers(listId);
  };

  const downloadTemplate = () => {
    const template = 'email,first_name,last_name\nexample@email.com,John,Doe';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* List Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select List
        </label>
        <select
          value={selectedListId || ''}
          onChange={(e) => handleListChange(Number(e.target.value))}
          className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          <option value="">Choose a list...</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.subscriber_count} subscribers)
            </option>
          ))}
        </select>
      </div>

      {selectedListId && (
        <>
          {/* Manual Add Form */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Individual Subscriber
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *"
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={handleManualAdd}
              disabled={!email || addingManually}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              {addingManually ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Subscriber
                </>
              )}
            </button>
          </div>

          {/* CSV Import */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Import via CSV
              </h4>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {csvData.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Click to upload CSV file
                </p>
                <p className="text-xs text-gray-500">
                  CSV should include: email, first_name, last_name
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {csvData.length} subscribers ready to import
                    </span>
                  </div>
                  <button
                    onClick={() => setCsvData([])}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                  {csvData.slice(0, 5).map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{sub.email}</span>
                      {sub.first_name && (
                        <span className="text-gray-500">- {sub.first_name} {sub.last_name}</span>
                      )}
                    </div>
                  ))}
                  {csvData.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      + {csvData.length - 5} more...
                    </p>
                  )}
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white'
                  }}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {csvData.length} Subscribers
                    </>
                  )}
                </button>
              </div>
            )}

            {importStats && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Import Successful!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Added</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{importStats.success}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duplicates</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{importStats.duplicates}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Errors</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{importStats.errors}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subscribers List */}
          {subscribers.length > 0 && (
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Current Subscribers ({subscribers.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscriber.first_name || subscriber.last_name
                            ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                            : subscriber.email}
                        </p>
                        {(subscriber.first_name || subscriber.last_name) && (
                          <p className="text-xs text-gray-500">{subscriber.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        subscriber.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : subscriber.status === 'unsubscribed'
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {subscriber.status}
                      </span>
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
