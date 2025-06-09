// components/EpubViewer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { Menu, Plus, Minus, BookOpen, Book, Maximize, Minimize } from 'lucide-react';

interface TocItem {
  id: string;
  material_id: string;
  topic: string;
  page_number: number | null;
  href: string | null;
  order: number;
}

interface EpubViewerProps {
  epubUrl: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  toc: TocItem[];
  setCurrentSection: (section: string) => void;
}

const EpubViewer: React.FC<EpubViewerProps> = ({ epubUrl, currentPage, setCurrentPage, setTotalPages, toc, setCurrentSection }) => {
  const [error, setError] = useState<string | null>(null);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [textSize, setTextSize] = useState(100);
  const [isTwoPageView, setIsTwoPageView] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  // Detect if the device is mobile (screen width < 768px)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  // Update isMobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMaximized(false); // Reset maximized state on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize with TOC closed on mobile
  useEffect(() => {
    if (isMobile) {
      setIsTocOpen(false);
    } else {
      setIsTocOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!epubUrl || !viewerRef.current) {
      setError('No EPUB URL provided or viewer not initialized');
      return;
    }

    isMountedRef.current = true;

    // Initialize the EPUB book
    bookRef.current = ePub(epubUrl);
    renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: isTwoPageView ? 'auto' : 'none',
    });

    // Apply text size scaling
    renditionRef.current.themes.default({
      body: {
        'font-size': `${textSize}% !important`,
      },
    });

    // Load book and generate locations
    bookRef.current.ready
      .then(() => {
        return renditionRef.current.display();
      })
      .then(() => {
        return bookRef.current.locations.generate(1000);
      })
      .then(() => {
        if (!isMountedRef.current) return;
        const total = bookRef.current?.locations?.total || 0;
        setTotalPages(total); // Set total pages in parent
        setLocationsLoaded(true);

        if (currentPage > 0 && total > 0) {
          const percentage = (currentPage - 1) / total;
          const location = bookRef.current.locations.cfiFromPercentage(percentage);
          renditionRef.current.display(location);
        }
      })
      .catch((err: Error) => {
        if (!isMountedRef.current) return;
        setError(`Failed to load EPUB: ${err.message}`);
      });

    // Handle page changes
    renditionRef.current.on('relocated', (location: any) => {
      if (
        !bookRef.current ||
        !bookRef.current.locations ||
        !bookRef.current.locations.total ||
        !location ||
        !location.start ||
        !location.start.cfi
      ) {
        return;
      }

      const percentage = bookRef.current.locations.percentageFromCfi(location.start.cfi);
      let newPage = Math.floor(percentage * bookRef.current.locations.total) + 1;

      if (isTwoPageView) {
        newPage = Math.floor(newPage / 2) * 2 + 1;
      }

      setCurrentPage(newPage);
    });

    // Handle rendering errors
    renditionRef.current.on('rendering', (error: Error) => {
      if (error) {
        setError(`Failed to render EPUB: ${error.message}`);
      }
    });

    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      bookRef.current?.destroy();
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [epubUrl, isTwoPageView, setCurrentPage, setTotalPages]);

  // Update text size
  useEffect(() => {
    if (!renditionRef.current) return;

    renditionRef.current.themes.default({
      body: {
        'font-size': `${textSize}% !important`,
      },
    });

    // Re-display the current location to adjust for reflowed content
    renditionRef.current.display();
  }, [textSize]);

  // Navigate to page
  useEffect(() => {
    if (!renditionRef.current || !bookRef.current || !locationsLoaded) return;

    const total = bookRef.current?.locations?.total || 0;
    if (currentPage > 0 && currentPage <= total) {
      const adjustedPage = isTwoPageView ? Math.floor((currentPage - 1) / 2) * 2 + 1 : currentPage;
      const percentage = (adjustedPage - 1) / total;
      const location = bookRef.current.locations.cfiFromPercentage(percentage);
      renditionRef.current.display(location);
    }
  }, [currentPage, locationsLoaded, isTwoPageView]);

  // Handle maximize/minimize
  const toggleMaximize = () => {
    setIsMaximized((prev) => !prev);
    if (isMobile) {
      setIsTocOpen(false); // Close TOC when maximizing on mobile
    }
  };

  // Navigate to the next page using rendition.next()
  const handleNextPage = () => {
    if (!renditionRef.current || !bookRef.current || !locationsLoaded) return;

    renditionRef.current.next().then(() => {
      const location = renditionRef.current.currentLocation();
      if (location && location.start && location.start.cfi) {
        const percentage = bookRef.current.locations.percentageFromCfi(location.start.cfi);
        let newPage = Math.floor(percentage * bookRef.current.locations.total) + 1;

        if (isTwoPageView) {
          newPage = Math.floor(newPage / 2) * 2 + 1;
        }

        const total = bookRef.current?.locations?.total || 0;
        if (newPage <= total) {
          setCurrentPage(newPage);
        }
      }
    });
  };

  // Navigate to the previous page using rendition.prev()
  const handlePrevPage = () => {
    if (!renditionRef.current || !bookRef.current || !locationsLoaded) return;

    renditionRef.current.prev().then(() => {
      const location = renditionRef.current.currentLocation();
      if (location && location.start && location.start.cfi) {
        const percentage = bookRef.current.locations.percentageFromCfi(location.start.cfi);
        let newPage = Math.floor(percentage * bookRef.current.locations.total) + 1;

        if (isTwoPageView) {
          newPage = Math.floor(newPage / 2) * 2 + 1;
        }

        if (newPage >= 1) {
          setCurrentPage(newPage);
        }
      }
    });
  };

  return (
    <div className={`w-full ${isMaximized && isMobile ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* TOC Sidebar */}
        <div
          className={`${
            isTocOpen
              ? 'fixed inset-0 z-50 md:static md:w-1/4 p-4 py-4 px-8 sm:pl-4 bg-white rounded-lg text-sm font-medium'
              : 'hidden md:block md:w-1/4 p-4 bg-gray-50 rounded-lg'
          } transition-all duration-300 ease-in-out`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">Contents</h2>
            <button
              onClick={() => setIsTocOpen(false)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600 sm:hidden" />
            </button>
          </div>
          <ul className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
            {toc.map((item) => (
              <li
                key={item.id}
                className="cursor-pointer text-sky-600 hover:bg-gray-200 p-2 py-1 rounded"
                onClick={() => {
                  if (item.href) {
                    setCurrentSection(item.href);
                    renditionRef.current?.display(item.href);
                    if (isMobile) setIsTocOpen(false);
                  }
                }}
              >
                {item.topic}
              </li>
            ))}
          </ul>
        </div>

        {/* EPUB Viewer */}
        <div className={`w-full ${isTocOpen && isMobile ? 'hidden' : 'md:w-3/4'} ${isMaximized && !isMobile ? 'h-screen' : 'h-full'}`}>
          {/* Control Bar */}
          <div className="flex justify-between items-center px-2 bg-gray-50 sm:rounded-lg shadow-sm">
            {/* TOC Toggle or Maximize/Minimize Button */}
            <button
              onClick={isMobile ? () => setIsTocOpen(true) : toggleMaximize}
              className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              {isMobile ? (
                <Menu className="w-6 h-6 text-gray-600" />
              ) : isMaximized ? (
                <Minimize className="w-6 h-6 text-gray-600" />
              ) : (
                <Maximize className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* Text Size and Maximize/Minimize Controls for Mobile */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTextSize((prev) => Math.max(50, prev - 10))}
                className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>
              <span>{textSize}%</span>
              <button
                onClick={() => setTextSize((prev) => Math.min(200, prev + 10))}
                className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
               </div>
              {isMobile && (
                <button
                  onClick={toggleMaximize}
                  className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {isMaximized ? (
                    <Minimize className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Maximize className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
           

            {/* Page View Toggle */}
            <button
              onClick={() => setIsTwoPageView((prev) => !prev)}
              className="hidden sm:block cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              {isTwoPageView ? (
                <BookOpen className="w-5 h-5 text-gray-600" />
              ) : (
                <Book className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <>
              <div
                className={`min-h-[500px] ${isMaximized ? 'h-[calc(100vh-80px)]' : 'h-[500px]'}`}
              >
                <div ref={viewerRef} className="w-full h-full" />
              </div>
              {locationsLoaded && bookRef.current?.locations?.total && ( // Only show when locations are loaded
                <div
                  className={`flex justify-between mt-4 sm:px-8 ${
                    isMaximized && isMobile
                      ? 'fixed bottom-0 left-0 right-0 p-2 bg-transparent shadow-lg z-10'
                      : ''
                  }`}
                >
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="cursor-pointer px-4 py-1 text-sm bg-sky-600 text-white rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="pt-4 text-gray-400">Page {currentPage} of {bookRef.current.locations.total}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === bookRef.current.locations.total}
                    className="cursor-pointer px-4 text-sm bg-sky-600 text-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpubViewer;