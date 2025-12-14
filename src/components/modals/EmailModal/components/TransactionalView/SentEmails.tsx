'use client';

import React, { useState } from 'react';
import { useSentLog } from '../../hooks/useSentLog';
import { 
  Mail, 
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  MousePointerClick
} from 'lucide-react';

interface SentEmailsProps {
  searchQuery?: string;
}

export default function SentEmails({ searchQuery = '' }: SentEmailsProps) {
  const { sentEmails, isLoading, error, filterByStatus, searchSentEmails } = useSentLog();
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEmails = searchQuery
    ? searchSentEmails(searchQuery)
    : filterByStatus(statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      failed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      scheduled: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sent Emails
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and track all sent transactional emails
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      {filteredEmails.length > 0 ? (
        <div className="space-y-3">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {email.recipient_name || email.recipient_email}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(email.status)}`}>
                        {email.status}
                      </span>
                    </div>
                    {email.recipient_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {email.recipient_email}
                      </p>
                    )}
                    <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                      {email.subject}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {email.status === 'scheduled' ? 'Scheduled' : 'Sent'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(email.status === 'scheduled' ? email.scheduled_at : email.sent_at)}
                  </p>
                </div>
              </div>

              {/* Engagement Stats */}
              {email.status === 'sent' && (
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {email.opened_at ? (
                      <>
                        <Eye className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span>Opened {formatDate(email.opened_at)}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Not opened</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {email.clicked_at ? (
                      <>
                        <MousePointerClick className="w-3 h-3 text-green-600 dark:text-green-400" />
                        <span>Clicked {formatDate(email.clicked_at)}</span>
                      </>
                    ) : (
                      <>
                        <MousePointerClick className="w-3 h-3" />
                        <span>Not clicked</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {email.status === 'failed' && email.error_message && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {email.error_message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No emails found' : 'No emails sent yet'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start sending emails using the composer above'}
          </p>
        </div>
      )}
    </div>
  );
}
