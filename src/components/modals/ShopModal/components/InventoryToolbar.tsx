'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface InventoryToolbarProps {
  totalCount: number;
  onAddInventory?: () => void;
}

export default function InventoryToolbar({
  totalCount,
  onAddInventory,
}: InventoryToolbarProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <div className="border-t border-slate-200/50 bg-white/30 backdrop-blur-sm rounded-b-2xl">
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-5 py-3 gap-2">
        {/* Left side - Count display */}
        <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/50 backdrop-blur-sm shadow-sm"
          style={{ color: primary.base }}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/30">
            {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Right side - Add Inventory button */}
        {onAddInventory && (
          <button
            onClick={onAddInventory}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Inventory</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
