import { useEffect } from 'react';
import { Room, LocalVideoTrack } from 'twilio-video';

/**
 * Custom hook to handle background mode changes and application
 */
export function useBackgroundEffect(
  backgroundMode: 'none' | 'blur' | 'color' | 'image',
  backgroundColor: string,
  backgroundImage: string | null,
  room: Room | null,
  localVideoTrack: LocalVideoTrack | null,
  startBackgroundProcessing: () => Promise<void>,
  stopBackgroundProcessing: () => void,
  restoreOriginalVideoTrack: () => Promise<void>
) {
  useEffect(() => {
    console.log('🎨 Background mode changed to:', backgroundMode, 'Color:', backgroundColor, 'Image:', backgroundImage);
    console.log('🎨 Current room state:', !!room, 'Local track:', !!localVideoTrack);

    const applyBackgroundEffect = async () => {
      if (!localVideoTrack) {
        console.log('❌ No local video track available');
        return;
      }

      if (!room) {
        console.log('❌ No room connection available');
        return;
      }

      try {
        // Stop any existing processing
        stopBackgroundProcessing();

        if (backgroundMode === 'none') {
          // Restore original video track
          console.log('🔄 Background effect: None - restoring original track');
          await restoreOriginalVideoTrack();
          return;
        }

        // For any background effect, we need to process the video
        console.log('🚀 Starting background processing for mode:', backgroundMode);
        await startBackgroundProcessing();

      } catch (error) {
        console.error('❌ Failed to apply background effect:', error);
      }
    };

    applyBackgroundEffect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up background processing');
      stopBackgroundProcessing();
    };
  }, [
    backgroundMode,
    backgroundColor,
    backgroundImage,
    room,
    localVideoTrack,
    startBackgroundProcessing,
    stopBackgroundProcessing,
    restoreOriginalVideoTrack
  ]);
}
