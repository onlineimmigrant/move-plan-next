'use client';

import { useState, useEffect, useRef } from 'react';

interface UseVideoCallUIReturn {
  isFullscreen: boolean;
  isMinimized: boolean;
  isMobile: boolean;
  viewMode: 'grid' | 'spotlight' | 'sidebar';
  pinnedParticipant: string | null;
  showSelfView: boolean;
  showInfoMenu: boolean;
  copiedField: string | null;
  width: number;
  height: number;
  x: number;
  y: number;
  isLocalVideoMirrored: boolean;
  setIsFullscreen: (value: boolean) => void;
  setIsMinimized: (value: boolean) => void;
  setViewMode: (value: 'grid' | 'spotlight' | 'sidebar') => void;
  setPinnedParticipant: (value: string | null) => void;
  setShowSelfView: (value: boolean) => void;
  setShowInfoMenu: (value: boolean) => void;
  setCopiedField: (value: string | null) => void;
  setWidth: (value: number) => void;
  setHeight: (value: number) => void;
  setX: (value: number) => void;
  setY: (value: number) => void;
  setIsLocalVideoMirrored: (value: boolean) => void;
  toggleFullscreen: () => void;
  toggleMinimized: () => void;
  getParticipantColor: (sender: string) => string;
}

export function useVideoCallUI(): UseVideoCallUIReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight' | 'sidebar'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [showSelfView, setShowSelfView] = useState(true);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(700);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isLocalVideoMirrored, setIsLocalVideoMirrored] = useState(true);

  // Store normal size before minimize/fullscreen
  const normalSizeRef = useRef({ width: 1000, height: 700, x: 0, y: 0 });

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !isFullscreen && !isMinimized) {
        setIsFullscreen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize centered position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isMobile) {
        setX(0);
        setY(0);
        normalSizeRef.current = { width: window.innerWidth, height: window.innerHeight, x: 0, y: 0 };
      } else {
        const initialX = Math.max(0, (window.innerWidth - 1000) / 2);
        const initialY = Math.max(0, (window.innerHeight - 700) / 2);
        setX(initialX);
        setY(initialY);
        normalSizeRef.current = { width: 1000, height: 700, x: initialX, y: initialY };
      }
    }
  }, [isMobile]);

  // Close info menu when clicking outside
  useEffect(() => {
    if (!showInfoMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-info-menu]')) {
        setShowInfoMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInfoMenu]);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Restore from fullscreen
      setWidth(normalSizeRef.current.width);
      setHeight(normalSizeRef.current.height);
      setX(normalSizeRef.current.x);
      setY(normalSizeRef.current.y);
      setIsFullscreen(false);
    } else {
      // Go fullscreen
      if (isMobile) {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
        setX(0);
        setY(0);
      } else {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
        setX(0);
        setY(0);
      }
      setIsFullscreen(true);
      setIsMinimized(false);
    }
  };

  const toggleMinimized = () => {
    if (isMinimized) {
      // Restore from minimized
      setWidth(normalSizeRef.current.width);
      setHeight(normalSizeRef.current.height);
      setX(normalSizeRef.current.x);
      setY(normalSizeRef.current.y);
      setIsMinimized(false);
    } else {
      // Minimize - just set the state, dimensions don't matter since we show button
      setIsMinimized(true);
      setIsFullscreen(false);
    }
  };

  // Generate consistent color for each participant
  const getParticipantColor = (sender: string) => {
    const colors = [
      'bg-[rgba(59,130,246,0.15)]',    // Blue
      'bg-[rgba(139,92,246,0.15)]',    // Purple
      'bg-[rgba(236,72,153,0.15)]',    // Pink
      'bg-[rgba(34,197,94,0.15)]',     // Green
      'bg-[rgba(249,115,22,0.15)]',    // Orange
      'bg-[rgba(14,165,233,0.15)]',    // Sky
      'bg-[rgba(168,85,247,0.15)]',    // Violet
      'bg-[rgba(244,63,94,0.15)]',     // Rose
    ];

    // Generate consistent index from sender name
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return {
    isFullscreen,
    isMinimized,
    isMobile,
    viewMode,
    pinnedParticipant,
    showSelfView,
    showInfoMenu,
    copiedField,
    width,
    height,
    x,
    y,
    isLocalVideoMirrored,
    setIsFullscreen,
    setIsMinimized,
    setViewMode,
    setPinnedParticipant,
    setShowSelfView,
    setShowInfoMenu,
    setCopiedField,
    setWidth,
    setHeight,
    setX,
    setY,
    setIsLocalVideoMirrored,
    toggleFullscreen,
    toggleMinimized,
    getParticipantColor,
  };
}