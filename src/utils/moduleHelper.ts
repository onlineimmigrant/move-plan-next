import type { OurFeature as Feature } from '@/types/comparison';

export type FeatureLevel = 'hub' | 'module' | 'feature';

export interface FeatureHierarchy {
  level: FeatureLevel;
  hub: string;
  module?: string;
  featureName: string;
}

export function detectFeatureLevel(
  packageField: string | null | undefined,
  typeField: string | null | undefined,
  nameField: string
): FeatureHierarchy {
  const pkg = packageField || '';
  const type = typeField || '';
  const name = nameField;
  
  // Level 1: All three fields are identical (Hub)
  if (pkg === type && type === name && name !== '') {
    return {
      level: 'hub',
      hub: name,
      featureName: name
    };
  }
  
  // Level 2: name equals type, but different from package (Module)
  if (name === type && name !== pkg && pkg !== '' && name !== '') {
    return {
      level: 'module',
      hub: pkg,
      module: name,
      featureName: name
    };
  }
  
  // Level 3: All different (Feature)
  return {
    level: 'feature',
    hub: pkg || 'Uncategorized',
    module: type || 'Other',
    featureName: name
  };
}

export interface HubData {
  hubFeature?: Feature;
  modules: Map<string, {
    moduleFeature?: Feature;
    features: Feature[];
  }>;
}

export function groupFeaturesByHierarchy(features: Feature[]): Map<string, HubData> {
  const hubs = new Map<string, HubData>();
  
  features.forEach(feature => {
    const { level, hub, module } = detectFeatureLevel(
      feature.package,
      feature.type,
      feature.name
    );
    
    // Initialize hub if needed
    if (!hubs.has(hub)) {
      hubs.set(hub, { 
        modules: new Map() 
      });
    }
    
    const hubData = hubs.get(hub)!;
    
    if (level === 'hub') {
      hubData.hubFeature = feature;
    } else if (level === 'module') {
      if (!hubData.modules.has(module!)) {
        hubData.modules.set(module!, { features: [] });
      }
      hubData.modules.get(module!)!.moduleFeature = feature;
    } else {
      // Level 3 feature
      if (!hubData.modules.has(module!)) {
        hubData.modules.set(module!, { features: [] });
      }
      hubData.modules.get(module!)!.features.push(feature);
    }
  });
  
  return hubs;
}

// Extract existing hubs from features
export function extractHubs(features: Feature[]): string[] {
  const hubs = new Set<string>();
  
  features.forEach(feature => {
    const { level, hub } = detectFeatureLevel(
      feature.package,
      feature.type,
      feature.name
    );
    if (level === 'hub' || hub) {
      hubs.add(hub);
    }
  });
  
  return Array.from(hubs).sort();
}

// Extract modules for a specific hub
export function extractModules(features: Feature[], hubName: string): string[] {
  const modules = new Set<string>();
  
  features.forEach(feature => {
    const { level, hub, module } = detectFeatureLevel(
      feature.package,
      feature.type,
      feature.name
    );
    
    if ((level === 'module' || level === 'feature') && hub === hubName && module) {
      modules.add(module);
    }
  });
  
  return Array.from(modules).sort();
}
