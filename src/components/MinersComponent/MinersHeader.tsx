'use client';

import React from 'react';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';

interface MinersHeaderProps {
  isAuthorized: boolean;
  sortedMinersLength: number;
  isCreatingSample: boolean;
  onCreateSample: () => void;
}

export default function MinersHeader({ 
  isAuthorized, 
  sortedMinersLength, 
  isCreatingSample, 
  onCreateSample 
}: MinersHeaderProps) {
  return (
    <div className="relative mb-8 sm:mb-12">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl"></div>
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div>
              <Tooltip 
                content={`Authentication Status: ✅ Authenticated as Admin | Organization: ${isAuthorized ? 'Verified' : 'Checking...'} | Role: Admin Access Granted`}
                variant="info-bottom"
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent cursor-help">
                  Miners Dashboard
                </h1>
              </Tooltip>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-sm sm:text-base text-emerald-700 font-semibold">Live Data</span>
                </div>
                <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                <span className="text-sm sm:text-base text-slate-600 font-medium">Admin Portal</span>
              </div>
            </div>
          </div>
          
          {sortedMinersLength === 0 && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-md opacity-20"></div>
              <Button
                onClick={onCreateSample}
                disabled={isCreatingSample}
                className="relative bg-white/90 backdrop-blur-xl hover:bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 border border-white/20"
              >
                {isCreatingSample ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span>Create Sample Miners</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
