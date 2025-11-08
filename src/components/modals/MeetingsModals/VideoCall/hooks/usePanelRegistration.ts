import { useEffect } from 'react';
import { UsePanelManagementReturn } from './usePanelManagement';

interface PanelRegistrationConfig {
  showSettings: boolean;
  showParticipants: boolean;
  showInfoMenu: boolean;
  showNotes: boolean;
  showChat: boolean;
  showTranscription: boolean;
  showAnalysis: boolean;
}

/**
 * Custom hook to handle panel registration lifecycle
 * Automatically registers panels when they become visible
 */
export function usePanelRegistration(
  panelManagement: UsePanelManagementReturn,
  config: PanelRegistrationConfig
) {
  // Register settings panel
  useEffect(() => {
    if (config.showSettings) {
      panelManagement.registerPanel('settings', { x: 16, y: 80 });
    }
  }, [config.showSettings, panelManagement]);

  // Register participants panel
  useEffect(() => {
    if (config.showParticipants) {
      panelManagement.registerPanel('participants', { x: 336, y: 120 });
    }
  }, [config.showParticipants, panelManagement]);

  // Register info panel
  useEffect(() => {
    if (config.showInfoMenu) {
      panelManagement.registerPanel('info', { x: 656, y: 160 });
    }
  }, [config.showInfoMenu, panelManagement]);

  // Register notes panel
  useEffect(() => {
    if (config.showNotes) {
      panelManagement.registerPanel('notes', { x: 16, y: 200 });
    }
  }, [config.showNotes, panelManagement]);

  // Register chat panel
  useEffect(() => {
    if (config.showChat) {
      panelManagement.registerPanel('chat', { x: 336, y: 240 });
    }
  }, [config.showChat, panelManagement]);

  // Register transcription panel
  useEffect(() => {
    if (config.showTranscription) {
      panelManagement.registerPanel('transcription', { x: 16, y: 280 });
    }
  }, [config.showTranscription, panelManagement]);

  // Register analysis panel
  useEffect(() => {
    if (config.showAnalysis) {
      panelManagement.registerPanel('analysis', { x: 432, y: 280 });
    }
  }, [config.showAnalysis, panelManagement]);
}
