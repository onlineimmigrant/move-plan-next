// Types for the Miners Management system

export interface ElectricityCostData {
  id: string;
  name: string;
  rate_per_kwh: number;
  currency: string;
  base_cost_per_month: number;
  user_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

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
  electricity_cost_id?: string;
  profiles?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

export interface MiningCostData {
  id: string;
  organization_id: string;
  electricity_rate_per_kwh: number;
  insurance_monthly: number;
  rent_monthly: number;
  cooling_monthly: number;
  maintenance_monthly: number;
  other_monthly: number;
  total_facility_consumption_kwh: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCalculation {
  electricityCostPerDay: number;
  facilityCostPerDay: number;
  totalCostPerDay: number;
  profitAfterCosts: number;
  roi: number;
  currency: string;
  breakdown: {
    insurance: number;
    rent: number;
    cooling: number;
    maintenance: number;
    other: number;
    facilityElectricity: number;
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
