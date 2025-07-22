'use client';

import React from 'react';
import { LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';
import Tooltip from '@/components/Tooltip';
import Button from '@/ui/Button';
import { MinerData } from './types';
import { getModelFromSerial, getMinerStatus } from './utils';

interface MinerCardProps {
  miner: MinerData;
  copiedId: string | null;
  onCopyToClipboard: (text: string, id: string) => void;
}

export default function MinerCard({ miner, copiedId, onCopyToClipboard }: MinerCardProps) {
  // Use centralized status determination
  const status = getMinerStatus(miner);
  return (
    <div className="group relative p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 hover:shadow-xl hover:border-blue-300/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header with improved mobile layout */}
      <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-900 text-sm sm:text-lg truncate max-w-[180px] sm:max-w-none">
            {miner.serial_number}
          </h4>
        </div>
        <div className="flex items-center">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm border backdrop-blur-sm ${
              status === 'online' 
                ? 'bg-green-100/80 text-green-800 border-green-200/60 shadow-green-100' 
                : status === 'offline'
                ? 'bg-red-100/80 text-red-800 border-red-200/60 shadow-red-100'
                : 'bg-gray-100/80 text-gray-800 border-gray-200/60 shadow-gray-100'
            }`}
          >
            {status}
          </span>
          <div className={`ml-2 w-2 h-2 rounded-full ${
            status === 'online' 
              ? 'bg-green-400 shadow-lg shadow-green-400/50' 
              : status === 'offline'
              ? 'bg-red-400 shadow-lg shadow-red-400/50'
              : 'bg-gray-400 shadow-lg shadow-gray-400/50'
          }`}></div>
        </div>
      </div>
      
      <div className="relative space-y-4 sm:space-y-6">
        {/* Key Metrics Grid with improved mobile responsiveness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Model</div>
            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">{getModelFromSerial(miner.serial_number)}</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">IP Address</div>
            <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{miner.ip_address}</div>
          </div>
        </div>

        {/* Performance Metrics with enhanced styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-blue-200/60 shadow-sm hover:shadow-lg transition-all duration-200 group/metric">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Hashrate</div>
              </div>
              <div className="font-bold text-blue-900 text-sm sm:text-base truncate">{miner.hashrate ? `${miner.hashrate} TH/s` : 'N/A'}</div>
            </div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-emerald-200/60 shadow-sm hover:shadow-lg transition-all duration-200 group/metric">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Daily Profit</div>
              </div>
              <div className="font-bold text-emerald-900 text-sm sm:text-base truncate">
                {miner.profit ? `$${miner.profit.toFixed(2)}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics with dynamic styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-orange-200/60 shadow-sm hover:shadow-lg transition-all duration-200 group/metric">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-600/10 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="text-xs text-orange-600 uppercase tracking-wide font-semibold">Power</div>
              </div>
              <div className="font-bold text-orange-900 text-sm sm:text-base truncate">{miner.power ? `${miner.power} W` : 'N/A'}</div>
            </div>
          </div>
          <div className={`relative overflow-hidden backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group/metric ${
            miner.temperature && miner.temperature > 80 
              ? 'bg-gradient-to-br from-red-50/80 to-red-100/80 border border-red-200/60' 
              : miner.temperature && miner.temperature > 70 
              ? 'bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 border border-yellow-200/60'
              : 'bg-gradient-to-br from-gray-50/80 to-gray-100/80 border border-gray-200/60'
          }`}>
            <div className={`absolute inset-0 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300 ${
              miner.temperature && miner.temperature > 80 
                ? 'bg-gradient-to-br from-red-400/10 to-red-600/10' 
                : miner.temperature && miner.temperature > 70 
                ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10'
                : 'bg-gradient-to-br from-gray-400/10 to-gray-600/10'
            }`}></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-1">
                <svg className={`w-3 h-3 ${
                  miner.temperature && miner.temperature > 80 
                    ? 'text-red-600' 
                    : miner.temperature && miner.temperature > 70 
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className={`text-xs uppercase tracking-wide font-semibold ${
                  miner.temperature && miner.temperature > 80 
                    ? 'text-red-600' 
                    : miner.temperature && miner.temperature > 70 
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>Temperature</div>
              </div>
              <div className={`font-bold text-sm sm:text-base truncate ${
                miner.temperature && miner.temperature > 80 
                  ? 'text-red-900' 
                  : miner.temperature && miner.temperature > 70 
                  ? 'text-yellow-900'
                  : 'text-gray-900'
              }`}>
                {miner.temperature ? `${miner.temperature}°C` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency with modern card design */}
        {miner.efficiency && (
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-purple-200/60 shadow-sm hover:shadow-lg transition-all duration-200 group/metric">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Efficiency</div>
              </div>
              <div className="font-bold text-purple-900 text-sm sm:text-base truncate">{miner.efficiency} J/TH</div>
            </div>
          </div>
        )}
        
        {/* Owner Information with enhanced design */}
        {miner.profiles && (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/80 to-indigo-100/80 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-indigo-200/60 shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">Owner</div>
                </div>
                <div className="font-bold text-indigo-900 text-sm sm:text-base truncate">
                  {miner.profiles.full_name || miner.profiles.email || 'Unknown'}
                </div>
              </div>
              <Tooltip content={`Copy User ID: ${miner.user_id}`} variant="info-top">
                <Button
                  onClick={() => onCopyToClipboard(miner.user_id, miner.id)}
                  className="p-2.5 bg-indigo-200/70 hover:bg-indigo-300/70 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm border border-indigo-300/60 group/button"
                >
                  {copiedId === miner.id ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600 group-hover/button:text-indigo-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
        
        {/* Last Updated with improved styling */}
        {miner.last_updated && (
          <div className="text-xs text-gray-500 flex items-center gap-2 bg-gray-50/60 p-2 rounded-lg">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">
              Updated: <span className="hidden sm:inline">{new Date(miner.last_updated).toLocaleDateString()} at {new Date(miner.last_updated).toLocaleTimeString()}</span>
              <span className="sm:hidden">{new Date(miner.last_updated).toLocaleDateString()}</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Performance Chart with enhanced design */}
      {miner.hashrate && (
        <div className="relative mt-6 pt-6 border-t border-gray-200/60">
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Hashrate Trend</div>
            </div>
          </div>
          <div className="relative h-20 sm:h-24 bg-gradient-to-r from-blue-50/80 via-blue-100/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 flex items-center justify-center border border-blue-200/60 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-blue-500/10 to-blue-400/5"></div>
            <div className="relative w-full flex items-center justify-center">
              <LineChart width={280} height={80} data={[
                { time: '2h', hashrate: (miner.hashrate || 0) * 0.92 },
                { time: '1h', hashrate: (miner.hashrate || 0) * 0.95 },
                { time: '30m', hashrate: (miner.hashrate || 0) * 0.98 },
                { time: 'now', hashrate: miner.hashrate }
              ]}>
                <Line 
                  type="monotone" 
                  dataKey="hashrate" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.8)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#374151', fontWeight: '600' }}
                />
              </LineChart>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
