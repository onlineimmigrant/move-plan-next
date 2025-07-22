import { MinerData, FilterState, GroupByKey, SortState } from './types';

// Utility functions for data processing
// Utility function to determine miner status consistently
export function getMinerStatus(miner: MinerData): 'online' | 'offline' | 'unknown' {
  if (miner.status) return miner.status as 'online' | 'offline' | 'unknown';
  // Fallback logic: if we have hashrate data, determine status
  if (miner.hashrate !== undefined) {
    return miner.hashrate > 0 ? 'online' : 'offline';
  }
  return 'unknown';
}

// Helper function to extract model from serial number
export function getModelFromSerial(serialNumber: string): string {
  if (serialNumber.includes('ANTMINER')) return 'Antminer';
  if (serialNumber.includes('WHATSMINER')) return 'Whatsminer';
  if (serialNumber.includes('AVALON')) return 'Avalon';
  return 'Unknown Model';
};

export const getProfitTier = (profit: number): string => {
  if (profit >= 15) return 'Very High (>$15)';
  if (profit >= 10) return 'High ($10-$15)';
  if (profit >= 5) return 'Medium ($5-$10)';
  return 'Very Low (<$5)';
};

export const getPowerTier = (power: number): string => {
  if (power >= 3500) return 'Very High (>3500W)';
  if (power >= 3000) return 'High (3000-3500W)';
  if (power >= 2500) return 'Medium (2500-3000W)';
  return 'Very Low (<2500W)';
};

export const filterMiners = (miners: MinerData[], filters: FilterState): MinerData[] => {
  return miners.filter(miner => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchMatches = [
        miner.serial_number?.toLowerCase().includes(searchLower),
        miner.ip_address?.toLowerCase().includes(searchLower),
        miner.profiles?.full_name?.toLowerCase().includes(searchLower),
        miner.profiles?.email?.toLowerCase().includes(searchLower),
        getModelFromSerial(miner.serial_number).toLowerCase().includes(searchLower)
      ].some(Boolean);
      
      if (!searchMatches) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(getMinerStatus(miner))) {
      return false;
    }

    // User filter
    if (filters.user.length > 0) {
      const userName = miner.profiles?.full_name || miner.profiles?.email || '';
      if (!filters.user.includes(userName)) return false;
    }

    // Model filter
    if (filters.model.length > 0 && !filters.model.includes(getModelFromSerial(miner.serial_number))) {
      return false;
    }

    // Profit range filter
    const profit = miner.profit || 0;
    if (profit < filters.profit_range[0] || profit > filters.profit_range[1]) {
      return false;
    }

    // Power range filter
    const power = miner.power || 0;
    if (power < filters.power_range[0] || power > filters.power_range[1]) {
      return false;
    }

    return true;
  });
};

export const groupMiners = (miners: MinerData[], groupBy: GroupByKey): Record<string, MinerData[]> => {
  if (groupBy === 'none') {
    return { 'All Miners': miners };
  }

  return miners.reduce((groups, miner) => {
    let key: string;
    
    switch (groupBy) {
      case 'status':
        key = getMinerStatus(miner);
        break;
      case 'user':
        key = miner.profiles?.full_name || miner.profiles?.email || 'Unknown User';
        break;
      case 'model':
        key = getModelFromSerial(miner.serial_number);
        break;
      case 'profit_tier':
        key = getProfitTier(miner.profit || 0);
        break;
      case 'power_tier':
        key = getPowerTier(miner.power || 0);
        break;
      default:
        key = 'Other';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(miner);
    return groups;
  }, {} as Record<string, MinerData[]>);
};

export const sortMiners = (miners: MinerData[], sort: SortState): MinerData[] => {
  return [...miners].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sort.key) {
      case 'serial_number':
        aVal = a.serial_number || '';
        bVal = b.serial_number || '';
        break;
      case 'hashrate':
        aVal = a.hashrate || 0;
        bVal = b.hashrate || 0;
        break;
      case 'profit':
        aVal = a.profit || 0;
        bVal = b.profit || 0;
        break;
      case 'power':
        aVal = a.power || 0;
        bVal = b.power || 0;
        break;
      case 'efficiency':
        aVal = a.efficiency || 0;
        bVal = b.efficiency || 0;
        break;
      case 'temperature':
        aVal = a.temperature || 0;
        bVal = b.temperature || 0;
        break;
      case 'uptime':
        aVal = a.uptime || 0;
        bVal = b.uptime || 0;
        break;
      default:
        aVal = a.serial_number || '';
        bVal = b.serial_number || '';
    }

    if (typeof aVal === 'string') {
      return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });
};
