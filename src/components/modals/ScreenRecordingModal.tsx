'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, VideoCameraIcon, MicrophoneIcon, StopIcon, PauseIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import Button from '@/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ScreenRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete?: (videoUrl: string, thumbnailUrl: string) => void;
  defaultFolder?: string;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'processing' | 'preview';
type QualityPreset = '720p' | '1080p';
type BackgroundFillMode = 'white' | 'blur' | 'blur-white';

export default function ScreenRecordingModal({
  isOpen,
  onClose,
  onRecordingComplete,
  defaultFolder = 'Videos',
}: ScreenRecordingModalProps) {
  const themeColors = useThemeColors();
  const { primary } = themeColors;
  
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [includeWebcam, setIncludeWebcam] = useState(false);
  const [highlightPointer, setHighlightPointer] = useState(true);
  const [highlightClicks, setHighlightClicks] = useState(true);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('1080p');
  const [backgroundFillMode, setBackgroundFillMode] = useState<BackgroundFillMode>('white');
  const [showHud, setShowHud] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // final stream used by MediaRecorder
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoElRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoElRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rndDefaultRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const clicksRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      stopRecording();
      cleanupStream();
      try {
        hudWindowRef.current?.close();
      } catch {
        // ignore
      }
      hudWindowRef.current = null;
    };
  }, []);

  const ensureHudWindow = () => {
    if (typeof window === 'undefined') return null;
    if (!showHud) return null;
    try {
      if (hudWindowRef.current && !hudWindowRef.current.closed) return hudWindowRef.current;

      const w = 340;
      const h = 210;
      const left = Math.max(0, Math.round(window.screenX + window.outerWidth - w - 24));
      const top = Math.max(0, Math.round(window.screenY + 72));
      const hud = window.open(
        '',
        'recording-hud',
        `popup=yes,width=${w},height=${h},left=${left},top=${top}`
      );
      if (!hud) return null;

      hud.document.title = 'Recording HUD';
      hud.document.body.style.margin = '0';
      hud.document.body.style.background = 'transparent';
      hud.document.body.innerHTML = `
        <div id="root" style="
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          padding: 12px;
        ">
          <div style="
            display: flex;
            gap: 12px;
            align-items: center;
            background: rgba(17, 24, 39, 0.78);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 16px;
            padding: 10px 12px;
          ">
            <div style="
              width: 64px;
              height: 64px;
              border-radius: 9999px;
              overflow: hidden;
              background: rgba(255,255,255,0.10);
              flex: 0 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <video id="hudWebcam" muted playsinline autoplay style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: none;
              "></video>
              <div id="hudWebcamOff" style="
                color: rgba(255,255,255,0.75);
                font-size: 11px;
                text-align: center;
                padding: 0 6px;
              ">Camera off</div>
            </div>
            <div style="flex: 1 1 auto; min-width: 0;">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  border-radius: 9999px;
                  background: #ef4444;
                  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.18);
                "></div>
                <div id="hudState" style="
                  color: rgba(255,255,255,0.9);
                  font-weight: 600;
                  font-size: 13px;
                ">Recording</div>
              </div>
              <div id="hudTime" style="
                color: #ffffff;
                font-weight: 800;
                font-variant-numeric: tabular-nums;
                font-size: 26px;
                letter-spacing: 0.5px;
                margin-top: 4px;
              ">00:00</div>
              <div style="
                color: rgba(255,255,255,0.7);
                font-size: 11px;
                margin-top: 2px;
              ">This HUD isn't added to the recording.</div>
            </div>
          </div>
        </div>
      `;

      hudWindowRef.current = hud;
      return hud;
    } catch {
      return null;
    }
  };

  const updateHud = () => {
    if (!showHud) return;
    const hud = hudWindowRef.current;
    if (!hud || hud.closed) return;
    try {
      const timeEl = hud.document.getElementById('hudTime');
      if (timeEl) timeEl.textContent = formatTime(recordingTime);

      const stateEl = hud.document.getElementById('hudState');
      if (stateEl) stateEl.textContent = recordingState === 'paused' ? 'Paused' : 'Recording';

      const dot = hud.document.querySelector<HTMLDivElement>('#hudState')?.previousElementSibling as HTMLDivElement | null;
      if (dot) {
        if (recordingState === 'paused') {
          dot.style.background = '#f59e0b';
          dot.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.18)';
        } else {
          dot.style.background = '#ef4444';
          dot.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.18)';
        }
      }

      const videoEl = hud.document.getElementById('hudWebcam') as HTMLVideoElement | null;
      const offEl = hud.document.getElementById('hudWebcamOff') as HTMLDivElement | null;
      const stream = webcamStreamRef.current;

      if (includeWebcam && stream && videoEl && offEl) {
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
          videoEl.muted = true;
          videoEl.playsInline = true;
          try {
            const p = videoEl.play();
            if (p && typeof (p as any).catch === 'function') (p as any).catch(() => undefined);
          } catch {
            // Autoplay can be blocked; ignore.
          }
        }
        videoEl.style.display = 'block';
        offEl.style.display = 'none';
      } else {
        if (videoEl) videoEl.style.display = 'none';
        if (offEl) offEl.style.display = 'block';
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      updateHud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingState, recordingTime, includeWebcam, showHud]);

  useEffect(() => {
    if (!showHud) {
      try {
        hudWindowRef.current?.close();
      } catch {
        // ignore
      }
      hudWindowRef.current = null;
    }
  }, [showHud]);

  useEffect(() => {
    if (isOpen) {
      rndDefaultRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (recordingState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (recordingState === 'countdown' && countdown === 0) {
      void startActualRecording();
    }
  }, [recordingState, countdown]);

  useEffect(() => {
    if (recordingState === 'preview' && previewUrl && videoPreviewRef.current) {
      try {
        videoPreviewRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [recordingState, previewUrl]);

  const waitForVideoReady = (video: HTMLVideoElement, timeoutMs = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const isReady = () => video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
      if (isReady()) {
        resolve();
        return;
      }

      let settled = false;
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('playing', onReady);
        if (timer) window.clearTimeout(timer);
      };
      const onReady = () => {
        if (settled) return;
        if (!isReady()) return;
        settled = true;
        cleanup();
        resolve();
      };

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Timed out waiting for screen video to start'));
      }, timeoutMs);

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('playing', onReady);
    });
  };

  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [recordingState]);

  const cleanupStream = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('click', handlePointerClick, true);

    const stopStream = (s: MediaStream | null) => {
      if (!s) return;
      s.getTracks().forEach((track) => track.stop());
    };

    stopStream(streamRef.current);
    stopStream(displayStreamRef.current);
    stopStream(micStreamRef.current);
    stopStream(webcamStreamRef.current);

    streamRef.current = null;
    displayStreamRef.current = null;
    micStreamRef.current = null;
    webcamStreamRef.current = null;

    if (screenVideoElRef.current) {
      screenVideoElRef.current.srcObject = null;
      screenVideoElRef.current = null;
    }
    if (webcamVideoElRef.current) {
      webcamVideoElRef.current.srcObject = null;
      webcamVideoElRef.current = null;
    }
    canvasRef.current = null;
    clicksRef.current = [];
  };

  const handlePointerMove = (e: MouseEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    pointerRef.current = {
      x: (e.clientX / w),
      y: (e.clientY / h),
    };
  };

  const handlePointerClick = (e: MouseEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    clicksRef.current.push({
      x: (e.clientX / w),
      y: (e.clientY / h),
      t: performance.now(),
    });
    if (clicksRef.current.length > 50) {
      clicksRef.current = clicksRef.current.slice(-50);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);

      // Request mic/webcam first while we still have a user gesture.
      // Some browsers will reject with NotAllowedError if requested only after getDisplayMedia resolves.
      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = audioStream;
        } catch (err) {
          console.warn('Could not capture audio:', err);
          setError('Microphone access denied, recording video only');
        }
      }

      if (includeWebcam) {
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          webcamStreamRef.current = camStream;
        } catch (err) {
          console.warn('Could not capture webcam:', err);
          setError('Camera access denied, recording screen only');
        }
      }

      // Open a tiny floating HUD window on user gesture.
      // It helps the presenter see elapsed time + webcam without adding it to the recording.
      if (showHud) {
        ensureHudWindow();
        updateHud();
      }
      
      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      displayStreamRef.current = displayStream;

      if (showHud) updateHud();

      // Listen for user stopping the screen share
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      // Start countdown
      setRecordingState('countdown');
      setCountdown(3);
      
    } catch (err: any) {
      console.error('Screen capture error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen recording permission denied');
      } else {
        setError('Failed to start screen recording');
      }
      cleanupStream();
    }
  };

  const startActualRecording = async () => {
    if (!displayStreamRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to initialize recorder canvas');
        cleanupStream();
        return;
      }

      const canvasSize = qualityPreset === '720p'
        ? { width: 1280, height: 720, bps: 1500000 }
        : { width: 1920, height: 1080, bps: 2500000 };

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      canvasRef.current = canvas;

      const screenVideo = document.createElement('video');
      screenVideo.muted = true;
      screenVideo.playsInline = true;
      screenVideo.srcObject = displayStreamRef.current;
      screenVideoElRef.current = screenVideo;

      const webcamVideo = includeWebcam && webcamStreamRef.current ? document.createElement('video') : null;
      if (webcamVideo && webcamStreamRef.current) {
        webcamVideo.muted = true;
        webcamVideo.playsInline = true;
        webcamVideo.srcObject = webcamStreamRef.current;
        webcamVideoElRef.current = webcamVideo;
      }

      try {
        await screenVideo.play();
      } catch {
        // ignore
      }
      if (webcamVideo) {
        try {
          await webcamVideo.play();
        } catch {
          // ignore
        }
      }

      try {
        await waitForVideoReady(screenVideo, 8000);
      } catch (e) {
        console.warn(e);
        setError('Failed to start screen capture (no frames received)');
        cleanupStream();
        return;
      }

      // Pointer/click overlays
      if (highlightPointer || highlightClicks) {
        window.addEventListener('mousemove', handlePointerMove);
        if (highlightClicks) {
          window.addEventListener('click', handlePointerClick, true);
        }
      }

      const drawFrame = () => {
        const now = performance.now();

        // Base background (when using contain, we need something in the empty space)
        ctx.fillStyle = backgroundFillMode === 'white' || backgroundFillMode === 'blur-white' ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw screen with a "blurred fill" (cover + blur) behind,
        // then a sharp "fit" (contain) on top.
        const vw = screenVideo.videoWidth || 0;
        const vh = screenVideo.videoHeight || 0;
        const safeVw = vw > 0 ? vw : canvas.width;
        const safeVh = vh > 0 ? vh : canvas.height;

        if (backgroundFillMode === 'blur' || backgroundFillMode === 'blur-white') {
          // Background layer: cover (cropped) + blur to remove hard bars
          const coverScale = Math.max(canvas.width / safeVw, canvas.height / safeVh);
          const coverDw = safeVw * coverScale;
          const coverDh = safeVh * coverScale;
          const coverDx = (canvas.width - coverDw) / 2;
          const coverDy = (canvas.height - coverDh) / 2;
          // Overscan a few pixels to avoid occasional edge gaps from blur/clipping
          const bleed = Math.max(6, Math.round(canvas.width * 0.004));
          ctx.save();
          try {
            // Canvas filter is supported in modern browsers; if not, it simply won't blur.
            (ctx as any).filter = 'blur(24px)';
          } catch {
            // ignore
          }
          // On white base, use a bit less alpha so the result stays bright.
          ctx.globalAlpha = backgroundFillMode === 'blur-white' ? 0.65 : 0.9;
          try {
            ctx.drawImage(screenVideo, coverDx - bleed, coverDy - bleed, coverDw + bleed * 2, coverDh + bleed * 2);
          } catch {
            // ignore draw errors during startup
          }
          ctx.restore();
        }

        // Foreground layer: contain (no crop)
        const fitScale = Math.min(canvas.width / safeVw, canvas.height / safeVh);
        const dw = safeVw * fitScale;
        const dh = safeVh * fitScale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        try {
          ctx.drawImage(screenVideo, dx, dy, dw, dh);
        } catch {
          // ignore draw errors during startup
        }

        // Webcam overlay (bottom-right) — circular
        if (webcamVideo && webcamVideo.videoWidth && webcamVideo.videoHeight) {
          // Loom-like bubble size (smaller)
          const diameter = Math.round(canvas.width * 0.16);
          const margin = Math.round(canvas.width * 0.02);
          const ox = canvas.width - diameter - margin;
          const oy = canvas.height - diameter - margin;
          const r = diameter / 2;
          const cx = ox + r;
          const cy = oy + r;

          // Subtle shadow/backplate
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fill();
          ctx.restore();

          // Clip to circle and draw a center-cropped square from the webcam feed
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          const srcW = webcamVideo.videoWidth;
          const srcH = webcamVideo.videoHeight;
          const side = Math.min(srcW, srcH);
          const sx = (srcW - side) / 2;
          const sy = (srcH - side) / 2;

          try {
            ctx.drawImage(webcamVideo, sx, sy, side, side, ox, oy, diameter, diameter);
          } catch {
            // ignore
          }

          ctx.restore();

        }

        // Live preview inside the modal (what you see is what gets recorded)
        if (livePreviewCanvasRef.current) {
          const previewCanvas = livePreviewCanvasRef.current;
          if (previewCanvas.width !== canvas.width || previewCanvas.height !== canvas.height) {
            previewCanvas.width = canvas.width;
            previewCanvas.height = canvas.height;
          }
          const pctx = previewCanvas.getContext('2d');
          if (pctx) {
            try {
              pctx.drawImage(canvas, 0, 0);
            } catch {
              // ignore
            }
          }
        }

        // Pointer highlight
        // Map pointer/click overlays into the same transformed coordinate space as the sharp (contain) layer
        const px = dx + pointerRef.current.x * dw;
        const py = dy + pointerRef.current.y * dh;

        if (highlightClicks) {
          const duration = 800;
          clicksRef.current = clicksRef.current.filter((c) => now - c.t < duration);
          for (const c of clicksRef.current) {
            const age = now - c.t;
            const t = Math.max(0, 1 - age / duration);
            const cx = dx + c.x * dw;
            const cy = dy + c.y * dh;
            const r = 10 + (1 - t) * 30;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(59,130,246,${0.65 * t})`;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
        }

        if (highlightPointer) {
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59,130,246,0.75)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(59,130,246,0.35)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

      };

      // Prime a first frame before we start the recorder to avoid missing initial seconds
      drawFrame();

      const canvasStream = canvas.captureStream(30);

      const drawLoop = () => {
        drawFrame();
        rafRef.current = requestAnimationFrame(drawLoop);
      };
      rafRef.current = requestAnimationFrame(drawLoop);
      const tracks: MediaStreamTrack[] = [];
      const videoTrack = canvasStream.getVideoTracks()[0];
      if (videoTrack) tracks.push(videoTrack);
      const micTrack = micStreamRef.current?.getAudioTracks?.()[0];
      if (micTrack) tracks.push(micTrack);

      const finalStream = new MediaStream(tracks);
      streamRef.current = finalStream;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: canvasSize.bps,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecordingState('preview');
        cleanupStream();
      };

      // Record as a single WebM to avoid timestamp gaps from concatenated timeslices
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState('recording');
      setRecordingTime(0);
      
    } catch (err) {
      console.error('MediaRecorder error:', err);
      setError('Failed to start recording');
      cleanupStream();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    try {
      hudWindowRef.current?.close();
    } catch {
      // ignore
    }
    hudWindowRef.current = null;
  };

  const generateThumbnail = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.src = URL.createObjectURL(videoBlob);
      video.currentTime = 1; // Capture at 1 second

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/webp', 0.85);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for thumbnail'));
      };
    });
  };

  const uploadToR2 = async () => {
    if (!previewUrl) return;

    try {
      setRecordingState('processing');
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Get video blob
      const response = await fetch(previewUrl);
      const videoBlob = await response.blob();

      // Generate thumbnail
      setUploadProgress(10);
      const thumbnailBlob = await generateThumbnail(videoBlob);

      // Upload video
      setUploadProgress(20);
      const timestamp = Date.now();
      const videoFileName = `screen-recording-${timestamp}.webm`;
      const videoFormData = new FormData();
      videoFormData.append('file', videoBlob, videoFileName);
      videoFormData.append('folder', defaultFolder);

      const videoUploadResponse = await fetch('/api/upload-video-r2', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: videoFormData,
      });

      if (!videoUploadResponse.ok) {
        const errorData = await videoUploadResponse.json();
        throw new Error(errorData.error || 'Video upload failed');
      }

      const { videoUrl } = await videoUploadResponse.json();
      setUploadProgress(70);

      // Upload thumbnail
      const thumbnailFileName = `thumbnail-${timestamp}.webp`;
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', thumbnailBlob, thumbnailFileName);
      thumbnailFormData.append('folder', 'Thumbnails');

      const thumbnailUploadResponse = await fetch('/api/upload-image-r2', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: thumbnailFormData,
      });

      if (!thumbnailUploadResponse.ok) {
        console.warn('Thumbnail upload failed, continuing...');
      }

      const thumbnailData = await thumbnailUploadResponse.json();
      const thumbnailUrl = thumbnailData.imageUrl || '';
      setUploadProgress(100);

      // Notify completion
      onRecordingComplete?.(videoUrl, thumbnailUrl);
      
      // Close modal
      setTimeout(() => {
        handleClose();
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload recording');
      setRecordingState('preview');
    }
  };

  const handleClose = () => {
    stopRecording();
    cleanupStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordingState('idle');
    setRecordingTime(0);
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    onClose();
  };

  const handleDiscard = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
  };

  if (!mounted || !isOpen) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  if (!rndDefaultRef.current) {
    if (isMobile) {
      rndDefaultRef.current = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    } else if (isTablet) {
      rndDefaultRef.current = {
        x: 20,
        y: 20,
        width: window.innerWidth - 40,
        height: window.innerHeight - 40,
      };
    } else {
      const desktopWidth = 822.25;
      const desktopHeight = Math.min(window.innerHeight - 40, 750 * 1.25);
      rndDefaultRef.current = {
        x: window.innerWidth / 2 - desktopWidth / 2,
        y: window.innerHeight / 2 - desktopHeight / 2,
        width: desktopWidth,
        height: desktopHeight,
      };
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-10010"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={recordingState === 'idle' || recordingState === 'preview' ? handleClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <Rnd
        default={rndDefaultRef.current}
        minWidth={isMobile ? window.innerWidth : isTablet ? 600 : 500}
        minHeight={isMobile ? window.innerHeight : isTablet ? 500 : 600}
        bounds="window"
        dragHandleClassName="modal-drag-handle"
        disableDragging={isMobile}
        enableResizing={!isMobile && recordingState === 'preview'}
        className="pointer-events-auto z-10011"
      >
        <div 
          className={`relative h-full flex flex-col ${isMobile ? 'bg-white dark:bg-gray-900' : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl'} ${isMobile ? '' : 'rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50'} overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`${isMobile ? '' : 'modal-drag-handle cursor-move'} shrink-0 bg-linear-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border-b border-gray-200/30 dark:border-gray-700/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: themeColors.cssVars.primary.base }} />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Screen Recording</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={recordingState === 'recording' || recordingState === 'processing'}
              className="p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all hover:ring-2 ring-gray-300 dark:ring-gray-600 disabled:opacity-50"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 
                            rounded-xl text-red-700 dark:text-red-400 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Countdown */}
            {recordingState === 'countdown' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-8xl font-bold text-red-600 dark:text-red-400 animate-pulse">
                  {countdown}
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Recording starts in...
                </p>
              </div>
            )}

            {/* Recording Controls */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="space-y-6">
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
                  <canvas
                    ref={livePreviewCanvasRef}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    recordingState === 'recording' 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-yellow-500'
                  }`}>
                    <div className="w-10 h-10 bg-white rounded-full"></div>
                  </div>
                  
                  <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                    {formatTime(recordingTime)}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {recordingState === 'recording' ? 'Recording in progress...' : 'Recording paused'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  {recordingState === 'recording' ? (
                    <Button
                      variant="outline"
                      onClick={pauseRecording}
                      className="flex items-center gap-2"
                    >
                      <PauseIcon className="w-5 h-5" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={resumeRecording}
                      className="flex items-center gap-2"
                    >
                      <PlayIcon className="w-5 h-5" />
                      Resume
                    </Button>
                  )}
                  
                  <Button
                    variant="danger"
                    onClick={stopRecording}
                    className="flex items-center gap-2"
                  >
                    <StopIcon className="w-5 h-5" />
                    Stop Recording
                  </Button>
                </div>
              </div>
            )}

            {/* Preview */}
            {(recordingState === 'preview' || recordingState === 'processing') && previewUrl && (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoPreviewRef}
                    src={previewUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {formatTime(recordingTime)}
                </p>
              </div>
            )}

            {/* Idle State */}
            {recordingState === 'idle' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Record Your Screen
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create tutorial videos by recording your screen activity
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Quality</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Affects file size</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={qualityPreset === '720p' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setQualityPreset('720p')}
                        >
                          720p
                        </Button>
                        <Button
                          type="button"
                          variant={qualityPreset === '1080p' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setQualityPreset('1080p')}
                        >
                          1080p
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Background</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">For empty space when fitting screen</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={backgroundFillMode === 'white' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setBackgroundFillMode('white')}
                        >
                          White
                        </Button>
                        <Button
                          type="button"
                          variant={backgroundFillMode === 'blur' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setBackgroundFillMode('blur')}
                        >
                          Blur
                        </Button>
                        <Button
                          type="button"
                          variant={backgroundFillMode === 'blur-white' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setBackgroundFillMode('blur-white')}
                        >
                          Blur + White
                        </Button>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                  hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showHud}
                      onChange={(e) => setShowHud(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">Show Recording HUD</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shows a timer and camera bubble in a separate window (disable for full-screen recording)
                      </p>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={includeAudio}
                        onChange={(e) => setIncludeAudio(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MicrophoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            Include Microphone
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Record your voice while capturing the screen
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={includeWebcam}
                        onChange={(e) => setIncludeWebcam(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            Include Camera Overlay
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Adds your webcam in the bottom-right corner
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={highlightPointer}
                        onChange={(e) => setHighlightPointer(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">Highlight Cursor</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shows a blue cursor dot in the recording</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={highlightClicks}
                        onChange={(e) => setHighlightClicks(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">Highlight Clicks</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adds a click ripple effect</p>
                      </div>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>Tip:</strong> You'll be able to select which screen or window to share after clicking start
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Fixed Footer */}
          {(recordingState === 'idle' || recordingState === 'preview' || recordingState === 'processing') && (
            <div className="shrink-0 border-t border-gray-200/30 dark:border-gray-700/30 bg-linear-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={recordingState === 'preview' ? handleDiscard : handleClose}
                  disabled={recordingState === 'processing'}
                  className="px-6"
                >
                  {recordingState === 'preview' ? 'Discard' : 'Cancel'}
                </Button>

                {recordingState === 'idle' ? (
                  <Button
                    variant="primary"
                    onClick={startRecording}
                    className="px-6 hover:shadow-lg transition-all"
                    style={{ backgroundColor: themeColors.cssVars.primary.base }}
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={uploadToR2}
                    disabled={recordingState === 'processing'}
                    className="px-6 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: themeColors.cssVars.primary.base }}
                  >
                    <span className="flex items-center gap-2">
                      {recordingState === 'processing' ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Uploading {uploadProgress}%
                        </>
                      ) : (
                        'Save Recording'
                      )}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Rnd>
    </div>,
    document.body
  );
}
