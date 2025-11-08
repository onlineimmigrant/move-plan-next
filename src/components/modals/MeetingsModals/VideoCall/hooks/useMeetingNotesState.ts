import { useState, useCallback } from 'react';

/**
 * Custom hook to manage meeting notes and panel visibility
 * Extracts notes and transcription panel state from VideoCallModal
 * 
 * @returns Meeting notes state and panel visibility controls
 */
export function useMeetingNotesState() {
  const [showNotes, setShowNotes] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const toggleNotes = useCallback(() => {
    setShowNotes((prev) => !prev);
  }, []);

  const toggleTranscription = useCallback(() => {
    setShowTranscription((prev) => !prev);
  }, []);

  const toggleAnalysis = useCallback(() => {
    setShowAnalysis((prev) => !prev);
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setMeetingNotes(notes);
  }, []);

  const clearNotes = useCallback(() => {
    setMeetingNotes('');
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowNotes(false);
    setShowTranscription(false);
    setShowAnalysis(false);
  }, []);

  return {
    // Notes state
    showNotes,
    meetingNotes,
    setShowNotes,
    updateNotes,
    clearNotes,
    toggleNotes,
    
    // Panel visibility
    showTranscription,
    showAnalysis,
    setShowTranscription,
    setShowAnalysis,
    toggleTranscription,
    toggleAnalysis,
    closeAllPanels,
  };
}

export type UseMeetingNotesStateReturn = ReturnType<typeof useMeetingNotesState>;
