'use client';

import React, { useState } from 'react';
import { useConnectedAccounts } from '../../hooks/useConnectedAccounts';
import { 
  Mail, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Plus,
  Star
} from 'lucide-react';
import { EmailProvider } from '../../types';

interface ConnectedAccountsProps {
  primary: { base: string; hover: string };
}

export default function ConnectedAccounts({ primary }: ConnectedAccountsProps) {
  const { accounts, isLoading, disconnectAccount, setPrimaryAccount, triggerSync, connectAccount } = useConnectedAccounts();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);

  const getProviderIcon = (provider: EmailProvider) => {
    switch (provider) {
      case 'gmail':
        return '📧';
      case 'outlook':
        return '📨';
      case 'ses':
        return '📤';
      default:
        return '📬';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Synced
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Syncing
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
            Pending
          </span>
        );
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    setActionLoading(accountId);
    try {
      await disconnectAccount(accountId);
    } catch (error) {
      alert('Failed to disconnect account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    setActionLoading(accountId);
    try {
      await setPrimaryAccount(accountId);
    } catch (error) {
      alert('Failed to set primary account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (accountId: string) => {
    setActionLoading(accountId);
    try {
      await triggerSync(accountId);
    } catch (error) {
      alert('Failed to sync account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnectGmail = async () => {
    setConnectingGmail(true);
    try {
      await connectAccount('gmail');
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      alert('Failed to connect Gmail. Please try again.');
    } finally {
      setConnectingGmail(false);
    }
  };

  const handleConnectOutlook = async () => {
    setConnectingOutlook(true);
    try {
      await connectAccount('outlook');
    } catch (error) {
      console.error('Failed to connect Outlook:', error);
      alert('Failed to connect Outlook. Please try again.');
    } finally {
      setConnectingOutlook(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect New Account Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleConnectGmail}
          disabled={connectingGmail}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Gmail
        </button>
        <button
          onClick={handleConnectOutlook}
          disabled={connectingOutlook}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectingOutlook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Outlook
        </button>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20">
          <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No accounts connected
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Connect your Gmail or Outlook account to get started
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleConnectGmail}
              className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              Connect Gmail
            </button>
            <button
              onClick={handleConnectOutlook}
              className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              Connect Outlook
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 w-full max-w-full overflow-x-hidden">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all w-full max-w-full overflow-hidden"
            >
              {/* Mobile: Stack vertically, Desktop: Row layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Provider Icon */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>

                {/* Account Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-all">
                      {account.email_address}
                    </h4>
                    {account.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      {account.provider}
                    </span>
                    {account.is_primary && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">• Primary</span>
                    )}
                    {/* Status Badge - Mobile inline with provider */}
                    <span className="sm:hidden">
                      {getStatusBadge(account.sync_status)}
                    </span>
                  </div>
                  {account.last_sync_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last synced: {new Date(account.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  {account.sync_error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                      {account.sync_error}
                    </p>
                  )}
                </div>

                {/* Status Badge - Desktop only */}
                <div className="hidden sm:block flex-shrink-0">
                  {getStatusBadge(account.sync_status)}
                </div>

                {/* Actions - Full width on mobile, auto on desktop */}
                <div className="flex items-center gap-2 justify-end sm:justify-start flex-shrink-0">
                  {!account.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(account.id)}
                      disabled={actionLoading === account.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Set as primary"
                    >
                      {actionLoading === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={actionLoading === account.id || account.sync_status === 'syncing'}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Sync now"
                  >
                    {actionLoading === account.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={actionLoading === account.id}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Disconnect"
                  >
                    {actionLoading === account.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
