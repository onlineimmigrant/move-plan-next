'use client';

import React, { useState } from 'react';
import { CalendarDaysIcon, VideoCameraIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import MeetingsBookingModal from '../modals/MeetingsModals/MeetingsBookingModal';

export default function Meetings() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Schedule and manage your video meetings
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CalendarDaysIcon className="w-5 h-5 mr-2" />
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full flex items-center px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Schedule Meeting</div>
                    <div className="text-sm text-gray-500">Book a new meeting</div>
                  </div>
                </button>

                <button className="w-full flex items-center px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <VideoCameraIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Join Meeting</div>
                    <div className="text-sm text-gray-500">Enter a meeting room</div>
                  </div>
                </button>

                <button className="w-full flex items-center px-4 py-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Cog6ToothIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Settings</div>
                    <div className="text-sm text-gray-500">Manage availability</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Meetings</h3>
              <div className="space-y-3">
                <div className="text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm">No upcoming meetings</p>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    Schedule your first meeting
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar</h3>
              <div className="text-center py-16 text-gray-500">
                <CalendarDaysIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium">Calendar View</p>
                <p className="text-sm mt-2">Full calendar integration coming soon</p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <MeetingsBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
}