import { ComparisonViewModel } from '@/types/comparison';

export interface ComparisonSectionProps {
  section: any;
}

export interface CachedData {
  data: ComparisonViewModel;
  timestamp: number;
}

export interface SortedModule {
  moduleName: string;
  moduleData: any;
  sortedFeatures: any[];
}

export interface SortedHub {
  hubName: string;
  hubData: any;
  sortedModules: SortedModule[];
}

export type AggregatedStatus = 'available' | 'partial' | 'unavailable';
