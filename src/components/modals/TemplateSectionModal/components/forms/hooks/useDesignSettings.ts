/**
 * useDesignSettings - Manages form design customization state
 */

import { useState, useCallback } from 'react';

interface ContentColumn {
  position: 'left' | 'center' | 'right';
  type: 'image' | 'video' | 'text';
  content: string;
}

interface DesignSettings {
  designStyle: 'large' | 'compact';
  designType: 'classic' | 'card';
  showCompanyLogo: boolean;
  columnLayout: 1 | 2 | 3;
  formPosition: 'left' | 'center' | 'right';
  contentColumns: ContentColumn[];
}

interface UseDesignSettingsReturn {
  designSettings: DesignSettings;
  setDesignStyle: (style: 'large' | 'compact') => void;
  setDesignType: (type: 'classic' | 'card') => void;
  setShowCompanyLogo: (show: boolean) => void;
  setColumnLayout: (layout: 1 | 2 | 3) => void;
  setFormPosition: (position: 'left' | 'center' | 'right') => void;
  setContentColumns: (columns: ContentColumn[]) => void;
  loadDesignSettings: (settings: Partial<DesignSettings>) => void;
  resetDesignSettings: () => void;
}

const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  designStyle: 'large',
  designType: 'classic',
  showCompanyLogo: false,
  columnLayout: 1,
  formPosition: 'left',
  contentColumns: [],
};

export function useDesignSettings(
  initialSettings?: Partial<DesignSettings>
): UseDesignSettingsReturn {
  const [designSettings, setDesignSettings] = useState<DesignSettings>({
    ...DEFAULT_DESIGN_SETTINGS,
    ...initialSettings,
  });

  const setDesignStyle = useCallback((style: 'large' | 'compact') => {
    setDesignSettings(prev => ({ ...prev, designStyle: style }));
  }, []);

  const setDesignType = useCallback((type: 'classic' | 'card') => {
    setDesignSettings(prev => ({ ...prev, designType: type }));
  }, []);

  const setShowCompanyLogo = useCallback((show: boolean) => {
    setDesignSettings(prev => ({ ...prev, showCompanyLogo: show }));
  }, []);

  const setColumnLayout = useCallback((layout: 1 | 2 | 3) => {
    setDesignSettings(prev => ({ ...prev, columnLayout: layout }));
  }, []);

  const setFormPosition = useCallback((position: 'left' | 'center' | 'right') => {
    setDesignSettings(prev => ({ ...prev, formPosition: position }));
  }, []);

  const setContentColumns = useCallback((columns: ContentColumn[]) => {
    setDesignSettings(prev => ({ ...prev, contentColumns: columns }));
  }, []);

  const loadDesignSettings = useCallback((settings: Partial<DesignSettings>) => {
    setDesignSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const resetDesignSettings = useCallback(() => {
    setDesignSettings(DEFAULT_DESIGN_SETTINGS);
  }, []);

  return {
    designSettings,
    setDesignStyle,
    setDesignType,
    setShowCompanyLogo,
    setColumnLayout,
    setFormPosition,
    setContentColumns,
    loadDesignSettings,
    resetDesignSettings,
  };
}
