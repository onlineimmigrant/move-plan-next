import { useEffect } from 'react';
import { Room } from 'twilio-video';

/**
 * Custom hook to handle network monitoring lifecycle
 * Automatically starts monitoring when connected and stops when disconnected
 */
export function useNetworkMonitoring(
  isConnected: boolean,
  room: Room | null,
  startNetworkMonitoring: (room: Room | null) => (() => void) | void,
  stopNetworkMonitoring: () => void
) {
  // Start network monitoring when connected
  useEffect(() => {
    if (isConnected && room) {
      console.log('🌐 Starting network monitoring');
      const cleanup = startNetworkMonitoring(room);
      return cleanup;
    }
  }, [isConnected, room, startNetworkMonitoring]);

  // Stop network monitoring when disconnected
  useEffect(() => {
    if (!isConnected) {
      console.log('🌐 Stopping network monitoring');
      stopNetworkMonitoring();
    }
  }, [isConnected, stopNetworkMonitoring]);
}
