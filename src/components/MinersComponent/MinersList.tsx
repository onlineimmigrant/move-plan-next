'use client';

import React from 'react';
import MinerCard from './MinerCard';
import { MinerData, GroupByKey } from './types';

interface MinersListProps {
  groupedMiners: Record<string, MinerData[]>;
  groupBy: GroupByKey;
  copiedId: string | null;
  onCopyToClipboard: (text: string, id: string) => void;
}

export default function MinersList({ 
  groupedMiners, 
  groupBy, 
  copiedId, 
  onCopyToClipboard 
}: MinersListProps) {
  return (
    <div className="space-y-6">
      {/* Grouped Miners Display */}
      {Object.entries(groupedMiners).map(([groupName, groupMiners]) => (
        <div key={groupName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              {groupBy !== 'none' && (
                <span className="text-2xl">
                  {groupBy === 'status' && '📊'}
                  {groupBy === 'user' && '👤'}
                  {groupBy === 'model' && '🔧'}
                  {groupBy === 'profit_tier' && '💰'}
                  {groupBy === 'power_tier' && '⚡'}
                </span>
              )}
              {groupName}
              <span className="ml-auto px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                {groupMiners.length} {groupMiners.length === 1 ? 'miner' : 'miners'}
              </span>
            </h3>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupMiners.map((miner) => (
                <MinerCard 
                  key={miner.id}
                  miner={miner}
                  copiedId={copiedId}
                  onCopyToClipboard={onCopyToClipboard}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
