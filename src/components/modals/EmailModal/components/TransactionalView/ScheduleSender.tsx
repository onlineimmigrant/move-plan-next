'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Calendar,
  Clock,
  Zap
} from 'lucide-react';

interface ScheduleSenderProps {
  onSendNow: () => void;
  onSchedule: (scheduleDate: string) => void;
  isSending: boolean;
  primary: { base: string; hover: string };
}

export default function ScheduleSender({ onSendNow, onSchedule, isSending, primary }: ScheduleSenderProps) {
  const [sendOption, setSendOption] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) return;
    const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;
    onSchedule(scheduledDateTime);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Send or Schedule
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose when to send your email
        </p>
      </div>

      {/* Send Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Send Now */}
        <button
          onClick={() => setSendOption('now')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            sendOption !== 'now'
              ? 'border-white/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-gray-800/60'
              : ''
          }`}
          style={sendOption === 'now' ? {
            borderColor: primary.base,
            backgroundColor: `${primary.base}0D`
          } : undefined}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              sendOption !== 'now'
                ? 'bg-gray-100 dark:bg-gray-800'
                : ''
            }`}
              style={sendOption === 'now' ? {
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              } : undefined}
            >
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Send Now
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send your email immediately to all recipients
          </p>
        </button>

        {/* Schedule */}
        <button
          onClick={() => setSendOption('scheduled')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            sendOption !== 'scheduled'
              ? 'border-white/20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-gray-800/60'
              : ''
          }`}
          style={sendOption === 'scheduled' ? {
            borderColor: primary.base,
            backgroundColor: `${primary.base}0D`
          } : undefined}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              sendOption !== 'scheduled'
                ? 'bg-gray-100 dark:bg-gray-800'
                : ''
            }`}
              style={sendOption === 'scheduled' ? {
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              } : undefined}
            >
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Schedule Send
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Schedule your email to be sent at a specific time
          </p>
        </button>
      </div>

      {/* Schedule Options */}
      {sendOption === 'scheduled' && (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={getMinDateTime()}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {scheduleDate && scheduleTime && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Your email will be sent on{' '}
                <span className="font-semibold">
                  {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="pt-4">
        {sendOption === 'now' ? (
          <button
            onClick={onSendNow}
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Now
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSchedule}
            disabled={isSending || !scheduleDate || !scheduleTime}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Schedule Send
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
