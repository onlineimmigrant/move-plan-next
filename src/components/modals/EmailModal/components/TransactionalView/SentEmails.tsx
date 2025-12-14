'use client';

import React, { useState, useMemo } from 'react';
import { useSentLog } from '../../hooks/useSentLog';
import Button from '@/ui/Button';
import { 
  Mail, 
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  MousePointerClick,
  X,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SentEmailsProps {
  searchQuery?: string;
}

export default function SentEmails({ searchQuery = '' }: SentEmailsProps) {
  const { sentEmails, isLoading, error, filterByStatus, searchSentEmails } = useSentLog();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const itemsPerPage = 20;

  const filteredEmails = useMemo(() => {
    let emails = searchQuery ? searchSentEmails(searchQuery) : filterByStatus(statusFilter);
    
    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      emails = emails.filter(email => {
        const emailDate = new Date(email.sent_at).getTime();
        const startDate = dateRange.start ? new Date(dateRange.start).getTime() : 0;
        const endDate = dateRange.end ? new Date(dateRange.end).getTime() : Date.now();
        return emailDate >= startDate && emailDate <= endDate;
      });
    }
    
    return emails;
  }, [searchQuery, statusFilter, dateRange, sentEmails]);

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResend = (email: any) => {
    // TODO: Implement resend functionality
    console.log('Resend email:', email);
  };

  const handleViewTemplate = (email: any) => {
    // TODO: Implement view template functionality
    console.log('View template:', email.template_id);
  };

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
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, start: e.target.value }));
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            placeholder="From"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, end: e.target.value }));
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            placeholder="To"
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setCurrentPage(1);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          {filteredEmails.length} result{filteredEmails.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Email List */}
      {paginatedEmails.length > 0 ? (
        <div className="space-y-3">
          {paginatedEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {email.to_name || email.to_email}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(email.status)}`}>
                        {email.status}
                      </span>
                    </div>
                    {email.to_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {email.to_email}
                      </p>
                    )}
                    <p className="text-sm text-gray-900 dark:text-white mt-1 font-medium">
                      {email.subject}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Sent
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(email.sent_at)}
                  </p>
                </div>
              </div>

              {/* Engagement Stats */}
              {email.status === 'sent' && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-2">
                    {email.template_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTemplate(email);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="View template"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResend(email);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Resend"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="light-outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="light-outline"
              size="sm"
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedEmail(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full overflow-hidden"
            style={{ maxWidth: '56rem', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Details
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(selectedEmail.status)}`}>
                      {selectedEmail.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedEmail.sent_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">From</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedEmail.from_name || selectedEmail.from_email}
                    </p>
                    {selectedEmail.from_name && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedEmail.from_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">To</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedEmail.to_name || selectedEmail.to_email}
                    </p>
                    {selectedEmail.to_name && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedEmail.to_email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedEmail.subject}</p>
                </div>
                {selectedEmail.ses_message_id && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message ID</label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono break-all">
                      {selectedEmail.ses_message_id}
                    </p>
                  </div>
                )}
                {selectedEmail.status === 'sent' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Opened</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedEmail.opened_at ? formatDate(selectedEmail.opened_at) : 'Not opened'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Clicked</label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedEmail.clicked_at ? formatDate(selectedEmail.clicked_at) : 'Not clicked'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex justify-between">
              <div className="flex gap-2">
                {selectedEmail.template_id && (
                  <Button
                    onClick={() => handleViewTemplate(selectedEmail)}
                    variant="light-outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Template
                  </Button>
                )}
                <Button
                  onClick={() => handleResend(selectedEmail)}
                  variant="light-outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend
                </Button>
              </div>
              <Button
                onClick={() => setSelectedEmail(null)}
                variant="primary"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
