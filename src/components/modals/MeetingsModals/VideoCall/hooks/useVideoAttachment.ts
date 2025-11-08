import { useEffect, useRef } from 'react';
import { LocalVideoTrack } from 'twilio-video';

interface VideoRefs {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  localVideoRefSpotlight: React.RefObject<HTMLVideoElement>;
  localVideoRefThumbnail: React.RefObject<HTMLVideoElement>;
}

/**
 * Custom hook to handle attaching local video track to multiple video elements
 * with retry logic and proper cleanup
 */
export function useVideoAttachment(
  localVideoTrack: LocalVideoTrack | null,
  videoRefs: VideoRefs,
  dependencies: {
    viewMode: string;
    pinnedParticipant: string | null;
    showSelfView: boolean;
    isMinimized: boolean;
    isConnected: boolean;
  }
) {
  useEffect(() => {
    if (!localVideoTrack) {
      console.log('📹 No local video track available to attach');
      return;
    }

    let retryCount = 0;
    const maxRetries = 10; // Try for 1 second total
    
    const attemptAttach = () => {
      console.log(`📹 Attempting to attach video (attempt ${retryCount + 1}/${maxRetries})`);
      console.log('📹 Track state:', {
        kind: localVideoTrack.kind,
        id: localVideoTrack.id,
        enabled: localVideoTrack.isEnabled,
        started: localVideoTrack.mediaStreamTrack?.readyState,
        mediaStreamTrack: !!localVideoTrack.mediaStreamTrack
      });
      
      const videoTrack = localVideoTrack;
      const refs = [
        { ref: videoRefs.localVideoRef, name: 'grid' },
        { ref: videoRefs.localVideoRefSpotlight, name: 'spotlight' },
        { ref: videoRefs.localVideoRefThumbnail, name: 'thumbnail' }
      ];

      let attachedCount = 0;
      refs.forEach(({ ref, name }) => {
        if (ref.current) {
          console.log(`📹 Attaching video track to ${name} ref`);
          
          // Detach first to avoid duplicates
          try {
            videoTrack.detach(ref.current);
          } catch (e) {
            // Ignore detach errors
          }
          
          try {
            const attachedElement = videoTrack.attach(ref.current);
            
            // Force video element to play
            if (attachedElement instanceof HTMLVideoElement) {
              attachedElement.play().catch(e => {
                console.warn(`⚠️ Failed to play video on ${name}:`, e);
              });
            }
            
            console.log(`✅ Track attached to ${name}:`, {
              hasSrcObject: !!attachedElement?.srcObject,
              videoWidth: (attachedElement as HTMLVideoElement)?.videoWidth,
              videoHeight: (attachedElement as HTMLVideoElement)?.videoHeight,
              paused: (attachedElement as HTMLVideoElement)?.paused,
              readyState: (attachedElement as HTMLVideoElement)?.readyState
            });
            
            attachedCount++;
          } catch (e) {
            console.error(`❌ Failed to attach to ${name}:`, e);
          }
        } else {
          console.log(`⏳ ${name} ref not ready yet`);
        }
      });
      
      console.log(`📹 Successfully attached to ${attachedCount}/${refs.length} video elements`);
      
      // If no refs were ready and we have retries left, try again
      if (attachedCount === 0 && retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptAttach, 100);
      } else if (attachedCount > 0) {
        console.log('✅ Video attachment complete!');
      } else {
        console.warn('⚠️ Could not attach video to any refs after all retries');
      }
    };

    // Start attempting after a short delay
    const timer = setTimeout(attemptAttach, 100);

    return () => {
      clearTimeout(timer);
      const refs = [
        videoRefs.localVideoRef,
        videoRefs.localVideoRefSpotlight,
        videoRefs.localVideoRefThumbnail
      ];
      refs.forEach(ref => {
        if (ref.current) {
          try {
            localVideoTrack.detach(ref.current);
          } catch (e) {
            // Ignore detach errors on cleanup
          }
        }
      });
    };
  }, [
    localVideoTrack,
    dependencies.viewMode,
    dependencies.pinnedParticipant,
    dependencies.showSelfView,
    dependencies.isMinimized,
    dependencies.isConnected,
    videoRefs.localVideoRef,
    videoRefs.localVideoRefSpotlight,
    videoRefs.localVideoRefThumbnail
  ]);
}
