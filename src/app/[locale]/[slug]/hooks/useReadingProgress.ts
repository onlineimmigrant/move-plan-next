'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReadingProgress {
  slug: string;
  progress: number; // 0-100
  lastPosition: number; // Scroll position
  totalHeight: number;
  readingTime: number; // Minutes
  lastRead: string; // ISO timestamp
}

const STORAGE_KEY = 'postpage_reading_progress';
const WORDS_PER_MINUTE = 200; // Average reading speed

/**
 * Reading Progress Hook
 * 
 * Tracks and persists reading progress across sessions.
 * Calculates estimated reading time and completion percentage.
 * 
 * @param slug - Current post slug
 * @param contentRef - Reference to content container
 * @returns Reading progress data and control functions
 * 
 * @performance
 * - Throttled scroll updates (500ms)
 * - localStorage persistence
 * - Automatic cleanup of old entries (30 days)
 * 
 * @example
 * const { progress, readingTime, isComplete } = useReadingProgress(slug, contentRef);
 */
export function useReadingProgress(
  slug: string,
  contentRef: React.RefObject<HTMLElement>
) {
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [readingTime, setReadingTime] = useState<number>(0);

  // Calculate estimated reading time when content is available
  useEffect(() => {
    if (!contentRef.current) return;
    
    const text = contentRef.current.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedTime = Math.ceil(wordCount / WORDS_PER_MINUTE);
    setReadingTime(estimatedTime);
  }, [contentRef]);

  // Load saved progress
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const allProgress: Record<string, ReadingProgress> = JSON.parse(saved);
      const current = allProgress[slug];

      if (current) {
        // Restore scroll position if within last 24 hours
        const lastRead = new Date(current.lastRead);
        const hoursSinceLastRead = (Date.now() - lastRead.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRead < 24 && current.lastPosition > 100) {
          // Restore position after a brief delay for smooth UX
          setTimeout(() => {
            window.scrollTo({
              top: current.lastPosition,
              behavior: 'smooth'
            });
          }, 300);
        }

        setProgress(current.progress);
        setIsComplete(current.progress >= 95);
      }
    } catch (error) {
      console.error('Failed to load reading progress:', error);
    }
  }, [slug]);

  // Track scroll progress
  useEffect(() => {
    if (!contentRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let lastUpdate = 0;

    const updateProgress = () => {
      const now = Date.now();
      // Throttle updates to once every 500ms
      if (now - lastUpdate < 500) return;
      lastUpdate = now;

      const element = contentRef.current;
      if (!element) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate progress percentage
      const scrolled = scrollTop + windowHeight;
      const total = documentHeight;
      const percentage = Math.min(Math.round((scrolled / total) * 100), 100);

      setProgress(percentage);
      setIsComplete(percentage >= 95);

      // Save to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const allProgress: Record<string, ReadingProgress> = saved ? JSON.parse(saved) : {};

        allProgress[slug] = {
          slug,
          progress: percentage,
          lastPosition: scrollTop,
          totalHeight: documentHeight,
          readingTime,
          lastRead: new Date().toISOString(),
        };

        // Clean up old entries (older than 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        Object.keys(allProgress).forEach(key => {
          const entry = allProgress[key];
          if (new Date(entry.lastRead).getTime() < thirtyDaysAgo) {
            delete allProgress[key];
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
      } catch (error) {
        console.error('Failed to save reading progress:', error);
      }
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateProgress, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress(); // Initial calculation

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [slug, contentRef, readingTime]);

  // Mark as complete
  const markComplete = useCallback(() => {
    setProgress(100);
    setIsComplete(true);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const allProgress: Record<string, ReadingProgress> = saved ? JSON.parse(saved) : {};

      allProgress[slug] = {
        ...allProgress[slug],
        slug,
        progress: 100,
        lastRead: new Date().toISOString(),
        readingTime,
        lastPosition: window.scrollY,
        totalHeight: document.documentElement.scrollHeight,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Failed to mark as complete:', error);
    }
  }, [slug, readingTime]);

  // Reset progress
  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsComplete(false);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const allProgress: Record<string, ReadingProgress> = JSON.parse(saved);
      delete allProgress[slug];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }, [slug]);

  return {
    progress,
    readingTime,
    isComplete,
    markComplete,
    resetProgress,
  };
}
