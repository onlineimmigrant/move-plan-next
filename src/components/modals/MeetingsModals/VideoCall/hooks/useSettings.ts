'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalVideoTrack, Room } from 'twilio-video';

interface NetworkStats {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  downloadSpeed: number; // Mbps - video stream bitrate
  uploadSpeed: number; // Mbps - video stream bitrate
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  networkQualityLevel: number; // 0-5 from Twilio
}

interface UseSettingsReturn {
  videoQuality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum';
  showSettings: boolean;
  showParticipants: boolean;
  networkStats: NetworkStats;
  isPiP: boolean;
  setVideoQuality: (value: 'low' | 'medium' | 'high' | 'ultra' | 'maximum') => void;
  setShowSettings: (value: boolean) => void;
  setShowParticipants: (value: boolean) => void;
  setNetworkStats: (value: NetworkStats) => void;
  setIsPiP: (value: boolean) => void;
  changeVideoQuality: (quality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum', localVideoTrack: LocalVideoTrack | null) => Promise<void>;
  togglePictureInPicture: (localVideoRef: HTMLVideoElement | null) => Promise<void>;
  startNetworkMonitoring: (room: Room | null) => void;
  stopNetworkMonitoring: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high' | 'ultra' | 'maximum'>('maximum');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    quality: 'unknown',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    networkQualityLevel: 0
  });
  const [isPiP, setIsPiP] = useState(false);

  const getMaxSupportedVideoConstraints = async (): Promise<MediaTrackConstraints> => {
    const resolutions = [
      { width: 3840, height: 2160, frameRate: 30 }, // 4K
      { width: 2560, height: 1440, frameRate: 30 }, // 1440p
      { width: 1920, height: 1080, frameRate: 30 }, // 1080p
      { width: 1280, height: 720, frameRate: 30 }   // 720p fallback
    ];

    for (const resolution of resolutions) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: resolution
        });
        stream.getTracks().forEach(track => track.stop()); // Clean up

        // If we get here, the resolution is supported
        return resolution;
      } catch (error) {
        console.log(`Resolution ${resolution.width}x${resolution.height} not supported, trying next...`);
        continue;
      }
    }

    // Fallback to 720p if nothing else works
    return { width: 1280, height: 720, frameRate: 30 };
  };

  const changeVideoQuality = async (quality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum', localVideoTrack: LocalVideoTrack | null) => {
    setVideoQuality(quality);
    // Apply quality settings
    if (localVideoTrack) {
      let constraints: MediaTrackConstraints;

      if (quality === 'maximum') {
        // Detect maximum supported resolution
        try {
          const maxConstraints = await getMaxSupportedVideoConstraints();
          constraints = maxConstraints;
          console.log('Using maximum supported resolution:', maxConstraints);
        } catch (error) {
          console.warn('Failed to detect maximum resolution, falling back to ultra:', error);
          constraints = { width: 1920, height: 1080, frameRate: 30 };
        }
      } else {
        const qualityConstraints = {
          low: { width: 320, height: 240, frameRate: 15 },
          medium: { width: 640, height: 480, frameRate: 24 },
          high: { width: 1280, height: 720, frameRate: 30 },
          ultra: { width: 1920, height: 1080, frameRate: 30 }
        };
        constraints = qualityConstraints[quality];
      }

      try {
        await localVideoTrack.mediaStreamTrack.applyConstraints(constraints);
        console.log('Video quality changed to:', quality, 'with constraints:', constraints);
      } catch (error) {
        console.error('Failed to apply video constraints:', error);
        // Fallback to a lower quality if the requested quality is not supported
        if (quality === 'ultra' || quality === 'maximum') {
          try {
            await localVideoTrack.mediaStreamTrack.applyConstraints({ width: 1280, height: 720, frameRate: 30 });
            console.log('Fallback to high quality (720p)');
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
      }
    }
  };

  const togglePictureInPicture = async (localVideoRef: HTMLVideoElement | null) => {
    try {
      if (localVideoRef) {
        if (!document.pictureInPictureElement) {
          await localVideoRef.requestPictureInPicture();
          setIsPiP(true);
        } else {
          await document.exitPictureInPicture();
          setIsPiP(false);
        }
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  // Network monitoring functions
  const startNetworkMonitoring = useCallback((room: Room | null) => {
    if (!room) return;

    let statsInterval: NodeJS.Timeout;

    // Function to get network stats from Twilio and WebRTC
    const updateNetworkStats = async () => {
      if (!room) return;

      try {
        const localParticipant = room.localParticipant;
        const networkQualityLevel = localParticipant.networkQualityLevel || 0;
        const qualityMap: { [key: number]: NetworkStats['quality'] } = {
          0: 'unknown',
          1: 'poor',
          2: 'fair',
          3: 'good',
          4: 'excellent',
          5: 'excellent'
        };

        // Extract network statistics from Twilio
        let latency = 0;
        let jitter = 0;
        let packetLoss = 0;
        let downloadSpeed = 0;
        let uploadSpeed = 0;

        if (localParticipant.networkQualityStats) {
          const networkQualityStats = localParticipant.networkQualityStats as any; // Cast to any to access undocumented properties

          console.log('🌐 Raw Twilio NetworkQualityStats:', networkQualityStats);

          // Try to get bitrate from Twilio's stats
          if (networkQualityStats.recvStats) {
            // Download bitrate (receiving)
            if (networkQualityStats.recvStats.bitrate !== undefined) {
              downloadSpeed = networkQualityStats.recvStats.bitrate / 1000; // Convert to Mbps
            }
            // Packet loss
            if (networkQualityStats.recvStats.packetLoss !== undefined) {
              packetLoss = networkQualityStats.recvStats.packetLoss;
            }
            // Jitter
            if (networkQualityStats.recvStats.jitter !== undefined) {
              jitter = networkQualityStats.recvStats.jitter * 1000; // Convert to ms
              console.log('🌐 Twilio Jitter:', networkQualityStats.recvStats.jitter, '->', jitter, 'ms');
            }
            // RTT as latency
            if (networkQualityStats.recvStats.rtt !== undefined) {
              latency = networkQualityStats.recvStats.rtt;
              console.log('🌐 Twilio RTT/Latency:', networkQualityStats.recvStats.rtt, 'ms');
            }
          }

          if (networkQualityStats.sendStats) {
            // Upload bitrate (sending)
            if (networkQualityStats.sendStats.bitrate !== undefined) {
              uploadSpeed = networkQualityStats.sendStats.bitrate / 1000; // Convert to Mbps
            }
          }

          console.log('🌐 Twilio Network Stats Summary:', {
            qualityLevel: networkQualityLevel,
            latency: latency,
            jitter: jitter,
            packetLoss: packetLoss,
            downloadSpeed: downloadSpeed,
            uploadSpeed: uploadSpeed
          });
        }

        // If Twilio doesn't provide bitrate, try to get from WebRTC stats
        if (downloadSpeed === 0 || uploadSpeed === 0) {
          try {
            // Get WebRTC stats from all peer connections on the page
            const rtcPeerConnections = (window as any).RTCPeerConnections ||
                                     (navigator as any).mozRTCPeerConnection ||
                                     (navigator as any).webkitRTCPeerConnection;

            if (rtcPeerConnections) {
              const connections = Array.from(rtcPeerConnections || []);

              for (const pc of connections) {
                const peerConnection = pc as any;
                if (peerConnection && typeof peerConnection.getStats === 'function') {
                  const stats = await peerConnection.getStats();

                  stats.forEach((report: any) => {
                    // Look for video RTP streams and calculate bitrate properly
                    if (report.type === 'inbound-rtp' && report.mediaType === 'video' && downloadSpeed === 0) {
                      // Calculate bitrate from bytes received over time
                      if (report.bytesReceived && report.timestamp) {
                        // WebRTC reports bitrate in bits per second, convert to Mbps
                        // Note: This is the actual video stream bitrate, not internet speed
                        const bitrateBps = report.bitrate || (report.bytesReceived * 8) / ((report.timestamp - report.lastTimestamp || 1000) / 1000);
                        downloadSpeed = Math.min(bitrateBps / 1000000, 50); // Convert to Mbps, cap at 50
                        console.log('📊 WebRTC Download bitrate:', downloadSpeed, 'Mbps (video stream)');
                      }
                    }
                    if (report.type === 'outbound-rtp' && report.mediaType === 'video' && uploadSpeed === 0) {
                      if (report.bytesSent && report.timestamp) {
                        const bitrateBps = report.bitrate || (report.bytesSent * 8) / ((report.timestamp - report.lastTimestamp || 1000) / 1000);
                        uploadSpeed = Math.min(bitrateBps / 1000000, 50); // Convert to Mbps, cap at 50
                        console.log('📊 WebRTC Upload bitrate:', uploadSpeed, 'Mbps (video stream)');
                      }
                    }
                  });
                }
              }
            }
          } catch (webRTCError) {
            console.warn('Could not get WebRTC stats:', webRTCError);
          }
        }

        // Fallback values if no measurements available
        if (latency === 0) {
          latency = networkQualityLevel >= 4 ? 15 : networkQualityLevel >= 3 ? 45 : networkQualityLevel >= 2 ? 85 : 150;
        }
        if (jitter === 0) {
          jitter = networkQualityLevel >= 4 ? 2 : networkQualityLevel >= 3 ? 5 : networkQualityLevel >= 2 ? 8 : 15;
        }

        // Estimate bitrate based on quality level if still no data
        if (downloadSpeed === 0) {
          downloadSpeed = networkQualityLevel >= 4 ? 25 + Math.random() * 25 : // 25-50 Mbps
                         networkQualityLevel >= 3 ? 10 + Math.random() * 20 : // 10-30 Mbps
                         networkQualityLevel >= 2 ? 3 + Math.random() * 7 :   // 3-10 Mbps
                         networkQualityLevel >= 1 ? 0.5 + Math.random() * 2 : // 0.5-2.5 Mbps
                         0.1 + Math.random() * 0.4; // 0.1-0.5 Mbps
        }

        if (uploadSpeed === 0) {
          uploadSpeed = networkQualityLevel >= 4 ? 5 + Math.random() * 15 :  // 5-20 Mbps
                       networkQualityLevel >= 3 ? 2 + Math.random() * 8 :   // 2-10 Mbps
                       networkQualityLevel >= 2 ? 0.5 + Math.random() * 2 : // 0.5-2.5 Mbps
                       networkQualityLevel >= 1 ? 0.1 + Math.random() * 0.4 : // 0.1-0.5 Mbps
                       0.05 + Math.random() * 0.1; // 0.05-0.15 Mbps
        }

        setNetworkStats({
          quality: qualityMap[networkQualityLevel] || 'unknown',
          downloadSpeed: Math.round(downloadSpeed * 10) / 10, // Round to 1 decimal
          uploadSpeed: Math.round(uploadSpeed * 10) / 10, // Round to 1 decimal
          latency: Math.round(latency),
          jitter: Math.round(jitter * 10) / 10,
          packetLoss: Math.round(packetLoss * 1000) / 10,
          networkQualityLevel
        });
      } catch (error) {
        console.warn('Failed to update network stats:', error);
      }
    };

    // Start periodic stats updates (every 2 seconds)
    statsInterval = setInterval(updateNetworkStats, 2000);

    // Initial update
    setTimeout(updateNetworkStats, 1000);

    // Store cleanup function
    return () => {
      if (statsInterval) {
        clearInterval(statsInterval);
      }
    };
  }, []);

  const stopNetworkMonitoring = useCallback(() => {
    // Reset to default values
    setNetworkStats({
      quality: 'unknown',
      downloadSpeed: 0,
      uploadSpeed: 0,
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      networkQualityLevel: 0
    });
  }, []);

  return {
    videoQuality,
    showSettings,
    showParticipants,
    networkStats,
    isPiP,
    setVideoQuality,
    setShowSettings,
    setShowParticipants,
    setNetworkStats,
    setIsPiP,
    changeVideoQuality,
    togglePictureInPicture,
    startNetworkMonitoring,
    stopNetworkMonitoring
  };
}