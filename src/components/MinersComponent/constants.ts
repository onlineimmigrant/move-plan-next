import { GroupByOption, SortOption } from './types';

export const groupByOptions: GroupByOption[] = [
  { value: 'none', label: 'No Grouping', icon: '📋' },
  { value: 'status', label: 'Group by Status', icon: '📊' },
  { value: 'user', label: 'Group by User', icon: '👤' },
  { value: 'model', label: 'Group by Model', icon: '🔧' },
  { value: 'profit_tier', label: 'Group by Profit', icon: '💰' },
  { value: 'power_tier', label: 'Group by Power', icon: '⚡' },
];

export const sortOptions: SortOption[] = [
  { value: 'serial_number-asc', label: 'Serial A-Z', icon: '🔤' },
  { value: 'serial_number-desc', label: 'Serial Z-A', icon: '🔤' },
  { value: 'profit-desc', label: 'Profit High-Low', icon: '💰' },
  { value: 'profit-asc', label: 'Profit Low-High', icon: '💰' },
  { value: 'power-desc', label: 'Power High-Low', icon: '⚡' },
  { value: 'power-asc', label: 'Power Low-High', icon: '⚡' },
  { value: 'hashrate-desc', label: 'Hashrate High-Low', icon: '⛏️' },
  { value: 'hashrate-asc', label: 'Hashrate Low-High', icon: '⛏️' },
  { value: 'efficiency-desc', label: 'Efficiency High-Low', icon: '📈' },
  { value: 'efficiency-asc', label: 'Efficiency Low-High', icon: '📈' },
  { value: 'temperature-asc', label: 'Temperature Low-High', icon: '🌡️' },
  { value: 'temperature-desc', label: 'Temperature High-Low', icon: '🌡️' },
  { value: 'uptime-desc', label: 'Uptime High-Low', icon: '⏱️' },
  { value: 'uptime-asc', label: 'Uptime Low-High', icon: '⏱️' },
];
