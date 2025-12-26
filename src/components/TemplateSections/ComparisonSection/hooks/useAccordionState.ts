import { useState, useCallback } from 'react';

export const useAccordionState = () => {
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(() => new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  const toggleHub = useCallback((hubName: string) => {
    setExpandedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(hubName)) {
        // Prevent collapsing the last open hub.
        if (next.size > 1) next.delete(hubName);
        return next;
      }
      next.add(hubName);
      return next;
    });
  }, []);

  const toggleModule = useCallback((moduleKey: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey);
      } else {
        newSet.add(moduleKey);
      }
      return newSet;
    });
  }, []);

  const toggleFeatureExpansion = useCallback((featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  }, []);

  return {
    expandedHubs,
    expandedModules,
    expandedFeatures,
    setExpandedHubs,
    setExpandedModules,
    toggleHub,
    toggleModule,
    toggleFeatureExpansion,
  };
};
