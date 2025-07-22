// Types for the Miners Management system

export interface MinerData {
  id: string;
  serial_number: string;
  ip_address: string;
  hashrate?: number;
  temperature?: number;
  profit?: number;
  power?: number;
  efficiency?: number;
  uptime?: number;
  status?: string;
  last_updated?: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

// Filter and grouping types
export type FilterKey = 'status' | 'user' | 'model' | 'profit_range' | 'power_range';
export type GroupByKey = 'status' | 'user' | 'model' | 'profit_tier' | 'power_tier' | 'none';
export type SortKey = 'serial_number' | 'hashrate' | 'profit' | 'power' | 'efficiency' | 'temperature' | 'uptime';

export interface FilterState {
  status: string[];
  user: string[];
  model: string[];
  profit_range: [number, number];
  power_range: [number, number];
  search: string;
}

export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export interface GroupByOption {
  value: GroupByKey;
  label: string;
  icon: string;
}

export interface SortOption {
  value: string;
  label: string;
  icon: string;
}
