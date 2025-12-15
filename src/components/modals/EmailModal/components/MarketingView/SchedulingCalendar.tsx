'use client';

import React, { useState, useMemo } from 'react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, Edit } from 'lucide-react';
import Button from '@/ui/Button';

interface SchedulingCalendarProps {
  primary: { base: string; hover: string };
  onViewCampaign?: (id: number) => void;
  onEditCampaign?: (id: number) => void;
}

export default function SchedulingCalendar({ primary, onViewCampaign, onEditCampaign }: SchedulingCalendarProps) {
  const { campaigns } = useCampaigns();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [mobileView, setMobileView] = useState<'calendar' | 'list'>('list');

  const scheduledCampaigns = useMemo(() => {
    return campaigns.filter((c) => c.status === 'scheduled' && c.scheduled_at);
  }, [campaigns]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getCampaignsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return scheduledCampaigns.filter((c) => {
      if (!c.scheduled_at) return false;
      const scheduledDate = new Date(c.scheduled_at);
      return (
        scheduledDate.getFullYear() === date.getFullYear() &&
        scheduledDate.getMonth() === date.getMonth() &&
        scheduledDate.getDate() === date.getDate()
      );
    });
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Scheduled Campaigns
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {scheduledCampaigns.length} campaigns scheduled
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Mobile: Calendar/List Toggle */}
          <div className="flex gap-1 sm:hidden flex-1">
            <button
              onClick={() => setMobileView('list')}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                mobileView === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setMobileView('calendar')}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                mobileView === 'calendar'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Calendar
            </button>
          </div>
          {/* Desktop: Month/Week Toggle */}
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                view === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px] ${
                view === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20">
        <Button onClick={prevMonth} variant="light-outline" size="sm" className="min-h-[44px] min-w-[44px]">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h4>
        <Button onClick={nextMonth} variant="light-outline" size="sm" className="min-h-[44px] min-w-[44px]">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Mobile List View */}
      {mobileView === 'list' && (
        <div className="sm:hidden space-y-2">
          {scheduledCampaigns.length > 0 ? (
            scheduledCampaigns
              .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {campaign.name}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(campaign.scheduled_at!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => onEditCampaign?.(campaign.id)} variant="light-outline" size="sm" className="flex-1 min-h-[44px]">
                      <Edit className="w-4 h-4" />
                      <span className="ml-2">Edit</span>
                    </Button>
                    <Button onClick={() => onViewCampaign?.(campaign.id)} variant="light-outline" size="sm" className="flex-1 min-h-[44px]">
                      <Eye className="w-4 h-4" />
                      <span className="ml-2">View</span>
                    </Button>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              No scheduled campaigns
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid - Hidden on mobile when list view active */}
      <div className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-3 sm:p-4 ${
        mobileView === 'list' ? 'hidden sm:block' : ''
      }`}>
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 p-1 sm:p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const daysCampaigns = getCampaignsForDate(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day}
                className={`aspect-square p-1 sm:p-2 rounded-lg border transition-all ${
                  isTodayDate
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                } ${daysCampaigns.length > 0 ? 'ring-1 sm:ring-2 ring-blue-500/50' : ''}`}
              >
                <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                  isTodayDate ? 'text-primary' : 'text-gray-900 dark:text-white'
                }`}>
                  {day}
                </div>
                
                {daysCampaigns.length > 0 && (
                  <div className="space-y-0.5 sm:space-y-1">
                    {/* Show dots on mobile, details on desktop */}
                    <div className="sm:hidden">
                      <div className="flex gap-0.5">
                        {daysCampaigns.slice(0, 3).map((campaign) => (
                          <div
                            key={campaign.id}
                            onClick={() => onViewCampaign?.(campaign.id)}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 cursor-pointer"
                            title={campaign.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:block space-y-1">
                      {daysCampaigns.slice(0, 2).map((campaign) => (
                        <div
                          key={campaign.id}
                          onClick={() => onViewCampaign?.(campaign.id)}
                          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 truncate"
                          title={campaign.name}
                        >
                          {new Date(campaign.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {campaign.name}
                        </div>
                      ))}
                      {daysCampaigns.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{daysCampaigns.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Campaigns List - Desktop Only (Mobile uses list view) */}
      {scheduledCampaigns.length > 0 && (
        <div className="hidden sm:block bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Upcoming Campaigns</h4>
          <div className="space-y-2">
            {scheduledCampaigns
              .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
              .slice(0, 5)
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {campaign.name}
                    </h5>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {new Date(campaign.scheduled_at!).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => onEditCampaign?.(campaign.id)} variant="light-outline" size="sm" className="min-h-[44px] min-w-[44px]">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button onClick={() => onViewCampaign?.(campaign.id)} variant="light-outline" size="sm" className="min-h-[44px] min-w-[44px]">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
