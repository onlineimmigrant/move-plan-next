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
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouContactMessage?: string;
  thankYouIcon?: 'checkmark' | 'heart' | 'star' | 'rocket' | 'trophy';
  thankYouButtonText?: string;
  thankYouButtonUrl?: string;
}

interface UseDesignSettingsReturn {
  designSettings: DesignSettings;
  setDesignStyle: (style: 'large' | 'compact') => void;
  setDesignType: (type: 'classic' | 'card') => void;
  setShowCompanyLogo: (show: boolean) => void;
  setColumnLayout: (layout: 1 | 2 | 3) => void;
  setFormPosition: (position: 'left' | 'center' | 'right') => void;
  setContentColumns: (columns: ContentColumn[]) => void;
  setThankYouTitle: (title: string) => void;
  setThankYouMessage: (message: string) => void;
  setThankYouContactMessage: (message: string) => void;
  setThankYouIcon: (icon: 'checkmark' | 'heart' | 'star' | 'rocket' | 'trophy') => void;
  setThankYouButtonText: (text: string) => void;
  setThankYouButtonUrl: (url: string) => void;
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

  const setThankYouTitle = useCallback((title: string) => {
    setDesignSettings(prev => ({ ...prev, thankYouTitle: title }));
  }, []);

  const setThankYouMessage = useCallback((message: string) => {
    setDesignSettings(prev => ({ ...prev, thankYouMessage: message }));
  }, []);

  const setThankYouContactMessage = useCallback((message: string) => {
    setDesignSettings(prev => ({ ...prev, thankYouContactMessage: message }));
  }, []);

  const setThankYouIcon = useCallback((icon: 'checkmark' | 'heart' | 'star' | 'rocket' | 'trophy') => {
    setDesignSettings(prev => ({ ...prev, thankYouIcon: icon }));
  }, []);

  const setThankYouButtonText = useCallback((text: string) => {
    setDesignSettings(prev => ({ ...prev, thankYouButtonText: text }));
  }, []);

  const setThankYouButtonUrl = useCallback((url: string) => {
    setDesignSettings(prev => ({ ...prev, thankYouButtonUrl: url }));
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
    setThankYouTitle,
    setThankYouMessage,
    setThankYouContactMessage,
    setThankYouIcon,
    setThankYouButtonText,
    setThankYouButtonUrl,
    loadDesignSettings,
    resetDesignSettings,
  };
}
