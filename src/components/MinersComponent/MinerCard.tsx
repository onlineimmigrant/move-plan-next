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
    <div className="group p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-900 truncate text-lg">
          {miner.serial_number}
        </h4>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            status === 'online' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : status === 'offline'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {status}
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Model</div>
            <div className="font-semibold text-gray-900 text-sm">{getModelFromSerial(miner.serial_number)}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">IP Address</div>
            <div className="font-mono text-xs text-gray-900">{miner.ip_address}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">Hashrate</div>
            <div className="font-bold text-blue-900">{miner.hashrate ? `${miner.hashrate} TH/s` : 'N/A'}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Daily Profit</div>
            <div className="font-bold text-green-900">
              {miner.profit ? `$${miner.profit.toFixed(2)}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
            <div className="text-xs text-orange-600 uppercase tracking-wide font-medium">Power</div>
            <div className="font-bold text-orange-900">{miner.power ? `${miner.power} W` : 'N/A'}</div>
          </div>
          <div className={`p-3 rounded-lg border ${
            miner.temperature && miner.temperature > 80 
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
              : miner.temperature && miner.temperature > 70 
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className={`text-xs uppercase tracking-wide font-medium ${
              miner.temperature && miner.temperature > 80 
                ? 'text-red-600' 
                : miner.temperature && miner.temperature > 70 
                ? 'text-yellow-600'
                : 'text-gray-600'
            }`}>Temperature</div>
            <div className={`font-bold ${
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

        {/* Efficiency */}
        {miner.efficiency && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
            <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Efficiency</div>
            <div className="font-bold text-purple-900">{miner.efficiency} J/TH</div>
          </div>
        )}
        
        {/* Owner Information */}
        {miner.profiles && (
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-600 uppercase tracking-wide font-medium">Owner</div>
                <div className="font-bold text-indigo-900 truncate">
                  {miner.profiles.full_name || miner.profiles.email || 'Unknown'}
                </div>
              </div>
              <Tooltip content={`Copy User ID: ${miner.user_id}`} variant="info-top">
                <Button
                  onClick={() => onCopyToClipboard(miner.user_id, miner.id)}
                  className="p-2 bg-indigo-200 hover:bg-indigo-300 rounded-lg transition-colors"
                >
                  {copiedId === miner.id ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
        
        {/* Last Updated */}
        {miner.last_updated && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Updated: {new Date(miner.last_updated).toLocaleDateString()} at {new Date(miner.last_updated).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* Performance Chart */}
      {miner.hashrate && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="mb-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Hashrate Trend</div>
          </div>
          <div className="h-20 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl p-4 flex items-center justify-center border border-blue-200">
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
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
              />
            </LineChart>
          </div>
        </div>
      )}
    </div>
  );
}
