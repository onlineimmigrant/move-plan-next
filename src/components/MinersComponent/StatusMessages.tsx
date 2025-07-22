'use client';

import React from 'react';

interface StatusMessagesProps {
  sampleMessage?: string;
  debugInfo?: string;
}

export default function StatusMessages({ sampleMessage, debugInfo }: StatusMessagesProps) {
  if (!sampleMessage && !debugInfo) return null;

  return (
    <>
      {/* Revolutionary Status Messages */}
      {sampleMessage && (
        <div className={`mb-6 sm:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-xl border shadow-2xl ${
          sampleMessage.startsWith('Error') 
            ? 'bg-red-50/90 border-red-200/50 shadow-red-500/10' 
            : 'bg-emerald-50/90 border-emerald-200/50 shadow-emerald-500/10'
        }`}>
          <div className={`absolute inset-0 ${
            sampleMessage.startsWith('Error')
              ? 'bg-gradient-to-r from-red-400/10 to-red-500/10'
              : 'bg-gradient-to-r from-emerald-400/10 to-emerald-500/10'
          }`}></div>
          <div className="relative p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 sm:p-3 rounded-xl ${
                sampleMessage.startsWith('Error')
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sampleMessage.startsWith('Error') ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.216 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-base sm:text-lg ${
                  sampleMessage.startsWith('Error') ? 'text-red-900' : 'text-emerald-900'
                }`}>
                  {sampleMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {debugInfo && (
        <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-blue-50/90 backdrop-blur-xl border border-blue-200/50 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-500/10"></div>
          <div className="relative p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-900 mb-1">Debug Information</p>
                <p className="text-blue-800 font-medium">{debugInfo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
