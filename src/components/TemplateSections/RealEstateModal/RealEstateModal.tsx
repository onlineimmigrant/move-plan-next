import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { TabType } from './types';
import property from './property.json';

interface RealEstateModalProps {
  data?: {
    whereLines?: any[];
    aboutLines?: any[];
    valueLines?: any[];
    resources?: any[];
  };
}

// Global reference to modal controls for external access
let globalModalControls: {
  openCard: (type: TabType) => void;
  closeCard: () => void;
} | null = null;

// Immediate cleanup function that runs as soon as this module loads
const immediateHashCleanup = () => {
  const validTypes: TabType[] = ['about', 'value', 'where', 'price'];
  const currentUrl = window.location.href;
  
  // Check if URL contains /#pattern
  if (currentUrl.includes('/#')) {
    const urlParts = currentUrl.split('/#');
    if (urlParts.length === 2) {
      const hash = urlParts[1];
      if (validTypes.includes(hash as TabType)) {
        // Clean up the URL immediately
        const cleanUrl = urlParts[0] + '#' + hash;
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }
};

// Run cleanup immediately when module loads
if (typeof window !== 'undefined') {
  immediateHashCleanup();
}

export const RealEstateModal: React.FC<RealEstateModalProps> = ({ data = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<TabType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Combine photos and videos for the slider (excluding plans)
  const mediaItems = property.resources
    .filter((resource: any) => resource.object_type !== 'plan') // Exclude plans as requested
    .map((resource: any) => ({
      type: resource.resource_type as 'image' | 'video',
      url: resource.public_id,
      title: resource.resource_type === 'video' ? 'Видео помещения' : 'Фото помещения'
    }));

  // Auto-slide functionality
  useEffect(() => {
    if (mediaItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
      }, 4000); // Change slide every 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [mediaItems.length]);

  const openCard = (type: TabType) => {
    const validTypes: TabType[] = ['about', 'value', 'where', 'price'];
    
    if (validTypes.includes(type)) {
      setActiveCard(type);
      setIsOpen(true);
      // Update URL hash for bookmarking
      window.history.replaceState(null, '', `#${type}`);
    }
  };

  const closeCard = () => {
    setActiveCard(null);
    setIsOpen(false);
    // Clear URL hash
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Set up global access and handle initial hash
  useEffect(() => {
    // Register global controls
    globalModalControls = {
      openCard,
      closeCard
    };

    // More aggressive initial hash handling
    const handleInitialHash = () => {
      const validTypes: TabType[] = ['about', 'value', 'where', 'price'];
      
      // Force cleanup of /#format URLs first
      const currentUrl = window.location.href;
      if (currentUrl.includes('/#')) {
        const urlParts = currentUrl.split('/#');
        if (urlParts.length === 2) {
          const hash = urlParts[1];
          if (validTypes.includes(hash as TabType)) {
            const cleanUrl = urlParts[0] + '#' + hash;
            window.history.replaceState(null, '', cleanUrl);
            openCard(hash as TabType);
            return;
          }
        }
      }
      
      // Then check normal hash
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (validTypes.includes(hash as TabType)) {
        openCard(hash as TabType);
      }
    };
    
    // Run immediately and also with a small delay to catch async navigation
    handleInitialHash();
    setTimeout(handleInitialHash, 100);

    const validTypes: TabType[] = ['about', 'value', 'where', 'price'];

    // Handle hash changes (for browser back/forward and menu clicks)
    const handleHashChange = () => {
      const fullHash = window.location.hash;
      // Handle both #about and /#about formats
      const hash = fullHash.replace(/^#\/?/, '');
      
      if (validTypes.includes(hash as TabType)) {
        setActiveCard(hash as TabType);
        setIsOpen(true);
      } else if (hash === '') {
        setActiveCard(null);
        setIsOpen(false);
      }
    };

    // More aggressive handler to catch all hash-related navigation
    const handleAllHashNavigation = () => {
      // Small delay to let the URL update
      setTimeout(() => {
        const fullHash = window.location.hash;
        const hash = fullHash.replace(/^#\/?/, '');
        
        if (validTypes.includes(hash as TabType)) {
          setActiveCard(hash as TabType);
          setIsOpen(true);
        }
      }, 10);
    };

    // Listen for multiple events that could change the hash
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement;
      
      if (link) {
        const href = link.getAttribute('href') || '';
        // Check if it's any kind of hash link (#about, /#about, etc.)
        if (href.includes('#')) {
          const hash = href.split('#')[1]?.replace(/^\//, '') || '';
          
          if (validTypes.includes(hash as TabType)) {
            e.preventDefault();
            // Force the correct URL format and open the modal
            window.history.pushState(null, '', `#${hash}`);
            openCard(hash as TabType);
          }
        }
      }
    };

    // Listen for all possible navigation events
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('hashchange', handleAllHashNavigation);
    document.addEventListener('click', handleLinkClick, true);
    
    // Also listen for popstate for browser navigation
    window.addEventListener('popstate', handleAllHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('hashchange', handleAllHashNavigation);
      window.removeEventListener('popstate', handleAllHashNavigation);
      document.removeEventListener('click', handleLinkClick, true);
      globalModalControls = null;
    };
  }, []);

  const {
    whereLines = [],
    aboutLines = [],
    valueLines = [],
    resources = []
  } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 real-estate-modal">

              {/* Enhanced Call to Action */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-6 text-white text-center mb-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-blue-600/20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 translate-y-12"></div>
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Готово к просмотру
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Изучите детали объекта</h3>
          <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
            Премиальное коммерческое помещение в центре Минска с отличными инвестиционными перспективами. 
            Ознакомьтесь с планировкой, ценами и расположением.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
            <button 
              onClick={() => openCard('about')}
              className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all hover:shadow-lg group"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
               Планы
              </div>
            </button>
            
            <button 
              onClick={() => openCard('price')}
              className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all hover:shadow-lg group border-2 border-white/30"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                Узнать цену
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '/contact'}
              className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-400 transition-all hover:shadow-lg group"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Связаться
              </div>
            </button>
          </div>
        </div>
      </div>

             {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Верифицированный объект
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Коммерческое помещение 102 м²
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Готовое к эксплуатации помещение в центре Минска для вашего бизнеса
        </p>
        
        {/* Animated stats with progress indicators */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="relative z-10 group-hover:text-white transition-colors">
              <div className="text-2xl font-bold text-gray-900 group-hover:text-white">$2,200</div>
              <div className="text-xs text-gray-600 group-hover:text-white">за м² • ниже рынка на 8%</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="relative z-10 group-hover:text-white transition-colors">
              <div className="text-2xl font-bold text-gray-900 group-hover:text-white">102</div>
              <div className="text-xs text-gray-600 group-hover:text-white">м² • оптимальная площадь</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="relative z-10 group-hover:text-white transition-colors">
              <div className="text-2xl font-bold text-gray-900 group-hover:text-white">0</div>
              <div className="text-xs text-gray-600 group-hover:text-white">этаж • отдельный вход</div>
            </div>
          </div>
        </div>
        
        {/* Market indicators */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gray-100 border border-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
              <span className="text-gray-600 text-sm font-medium">Высокий спрос</span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 text-sm">+12% за год</span>
            </div>
          </div>
        </div>
      </div>

              {/* Interactive Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {/* Progress indicator for user journey */}
        <div className="col-span-full mb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Обзор</span>
            <div className="w-8 h-px bg-gray-300"></div>
            <span>Локация</span>
            <div className="w-8 h-px bg-gray-300"></div>
            <span>Стоимость</span>
          </div>
        </div>
        <button
          onClick={() => openCard('about')}
          className="relative bg-white hover:bg-gray-100 border border-gray-100 hover:border-gray-600 rounded-xl p-5 text-center transition-all duration-200 group hover:shadow-lg hover:-translate-y-1"
        >
          <div className="absolute top-3 right-3">
            <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">12 планов</span>
          </div>
          <div className="w-14 h-14 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center group-hover:bg-teal-200 group-hover:scale-105 transition-all duration-200">
            <svg className="w-7 h-7 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-base mb-1">О помещении</h3>
          <p className="text-sm text-gray-600">Планировка и характеристики</p>
          <div className="mt-3 flex items-center justify-center text-teal-600 text-xs font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Подробнее
          </div>
        </button>

        <button
          onClick={() => openCard('where')}
          className="relative bg-white hover:bg-gray-100 border border-gray-100 hover:border-gray-600 rounded-xl p-5 text-center transition-all duration-200 group hover:shadow-lg hover:-translate-y-1"
        >
          <div className="absolute top-3 right-3">
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Центр</span>
          </div>
          <div className="w-14 h-14 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 group-hover:scale-105 transition-all duration-200">
            <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-base mb-1">Адрес</h3>
          <p className="text-sm text-gray-600">Местоположение на карте</p>
          <div className="mt-3 flex items-center justify-center text-green-600 text-xs font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            На карте
          </div>
        </button>

        <button
          onClick={() => openCard('price')}
          className="relative bg-white hover:bg-gray-100 border border-gray-100 hover:border-gray-600 rounded-xl p-5 text-center transition-all duration-200 group hover:shadow-lg hover:-translate-y-1"
        >
          <div className="absolute top-3 right-3">
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">$224K</span>
          </div>
          <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 group-hover:scale-105 transition-all duration-200">
            <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-base mb-1">Цена</h3>
          <p className="text-sm text-gray-600">Стоимость и условия</p>
          <div className="mt-3 flex items-center justify-center text-purple-600 text-xs font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Подробности
          </div>
        </button>
      </div>
      {/* Auto Media Slider */}
      <div className="relative w-full h-72 sm:h-96 md:h-[28rem] lg:h-[36rem] xl:h-[42rem] 2xl:h-[48rem] mb-8 rounded-xl overflow-hidden shadow-lg">
        {mediaItems.length > 0 && (
          <>
            {mediaItems[currentSlide].type === 'image' ? (
              <img
                src={mediaItems[currentSlide].url}
                alt={mediaItems[currentSlide].title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={mediaItems[currentSlide].url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            )}
            
            {/* Overlay with title */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h3 className="text-white text-lg font-semibold mb-1">
                {mediaItems[currentSlide].title}
              </h3>
              <p className="text-white/80 text-sm">
                {currentSlide + 1} из {mediaItems.length}
              </p>
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {mediaItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % mediaItems.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Media type indicator */}
            <div className="absolute top-4 left-4">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {mediaItems[currentSlide].type === 'image' ? (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Фото
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Видео
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </div>

 

      {/* Transportation & Infrastructure */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" clipRule="evenodd" />
          </svg>
          Транспортная доступность
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 000 4h12a2 2 0 000-4H4z" />
                <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="font-semibold text-gray-800">Метро</div>
            <div className="text-sm text-green-600">5 мин пешком</div>
            <div className="text-xs text-gray-500 mt-1">Ст. Восток</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6s.792.193 1.264.979L14 12H6l2.736-5.021z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="font-semibold text-gray-800">Автобус</div>
            <div className="text-sm text-blue-600">2 мин пешком</div>
            <div className="text-xs text-gray-500 mt-1">6 маршрутов</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 000 2h.82l1.058 5.287a3 3 0 002.935 2.447h4.374a3 3 0 002.935-2.447L16.18 6H17a1 1 0 100-2H3z" />
              </svg>
            </div>
            <div className="font-semibold text-gray-800">Парковка</div>
            <div className="text-sm text-purple-600">У здания</div>
            <div className="text-xs text-gray-500 mt-1">15 мест</div>
          </div>
        </div>
        
        {/* Infrastructure highlights */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Поликлиника</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-gray-700">Школы</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Магазины</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Банки</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Analysis */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0710 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
          Инвестиционный анализ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">+12.5%</div>
            <div className="text-sm text-gray-500">Рост стоимости за год</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">8.2%</div>
            <div className="text-sm text-gray-500">Доходность от аренды</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">7.8</div>
            <div className="text-sm text-gray-500">Лет окупаемости</div>
          </div>
        </div>

        {/* Investment Calculator */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Калькулятор доходности</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Стоимость помещения:</span>
              <span className="font-semibold">$224,400</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ежемесячная аренда:</span>
              <span className="font-semibold text-gray-900">$1,540</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Годовой доход:</span>
              <span className="font-semibold text-gray-900">$18,480</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">ROI от полной стоимости:</span>
                <span className="font-bold text-gray-900">8.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Readiness */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 mb-8 border border-gray-200">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Готовность к сделке</h3>
          <p className="text-sm text-gray-600">Все документы подготовлены для быстрого оформления</p>
        </div>
        
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
            <div className="h-full bg-gradient-to-r from-teal-500 to-green-500 w-full rounded-full"></div>
          </div>
          
          {/* Timeline steps */}
          <div className="flex justify-between w-full relative z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                ✓
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-800">Документы</div>
                <div className="text-xs text-teal-600">Готовы</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                ✓
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-800">Оценка</div>
                <div className="text-xs text-green-600">Выполнена</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                ✓
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-800">Юридическая</div>
                <div className="text-xs text-blue-600">Проверена</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse">
                🤝
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-800">Сделка</div>
                <div className="text-xs text-purple-600">Ожидает</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Можно оформлять сделку уже сегодня
          </span>
        </div>
      </div>



      {/* Detailed Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">Характеристики помещения</h2>
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Проверено</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start mb-2">
              <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-gray-500 text-sm">Общая площадь</span>
            </div>
            <div className="font-bold text-gray-800 text-xl">102 м²</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-500 text-sm">Назначение</span>
            </div>
            <div className="font-semibold text-gray-800">Многофункциональное</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start mb-2">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-500 text-sm">Расположение</span>
            </div>
            <div className="font-semibold text-gray-800">Цокольный этаж</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-500 text-sm">Статус</span>
            </div>
            <div className="font-semibold text-green-600 flex items-center justify-center sm:justify-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Готово к продаже
            </div>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Описание объекта</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Современное помещение в престижном районе с развитой инфраструктурой. 
                Идеально подходит для размещения офиса компании или коммерческой деятельности (например, торговля, услуги).
              </p>
              
              {/* Interactive features grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="group cursor-pointer">
                  <div className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-3 text-center transition-all">

                    <div className="text-xs font-medium text-green-800">Отдельный вход</div>
                    <div className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">Удобство для клиентов</div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 text-center transition-all">
                
                    <div className="text-xs font-medium text-blue-800">Парковка</div>
                    <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">15 мест рядом</div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg p-3 text-center transition-all">
         
                    <div className="text-xs font-medium text-gray-800">Ремонт</div>
                    <div className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">Свежий ремонт</div>
                  </div>
                </div>
                
                <div className="group cursor-pointer">
                  <div className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg p-3 text-center transition-all">
               
                    <div className="text-xs font-medium text-orange-800">Центр</div>
                    <div className="text-xs text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">500м от метро</div>
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Анализ рынка</h3>
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Актуальные данные</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Цена за м²</span>
                  <span className="text-sm font-medium text-teal-600">Выгодно</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full w-2/3 relative">
                    <div className="absolute right-0 top-0 w-3 h-3 bg-teal-600 rounded-full transform translate-x-1"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$2,200</span>
                  <span>Среднее: $2,400</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Площадь</span>
                  <span className="text-sm font-medium text-green-600">Оптимальная</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full w-4/5 relative">
                    <div className="absolute right-0 top-0 w-3 h-3 bg-green-600 rounded-full transform translate-x-1"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>102 м²</span>
                  <span>Востребованный размер</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Локация</span>
                  <span className="text-sm font-medium text-purple-600">Премиум</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full w-full relative">
                    <div className="absolute right-0 top-0 w-3 h-3 bg-purple-600 rounded-full transform translate-x-1"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Центр города</span>
                  <span>ТОП-5% локаций</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                <div className="text-3xl font-bold text-emerald-700 mb-1">92</div>
                <div className="text-sm text-emerald-600 mb-2">Инвестиционный рейтинг</div>
                <div className="text-xs text-gray-600">из 100 возможных баллов</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">85%</div>
                  <div className="text-xs text-blue-500">Ликвидность</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">9.6%</div>
                  <div className="text-xs text-orange-500">Доходность</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendation Engine */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Персональные рекомендации
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Для инвестиций</div>
              <div className="text-xs text-gray-600">Оценка: 92/100</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                �
              </div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Для бизнеса</div>
              <div className="text-xs text-blue-600">Оценка: 88/100</div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-800 mb-1">Для перепродажи</div>
              <div className="text-xs text-gray-700">Оценка: 85/100</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm mb-1">Рекомендация эксперта</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                Коммерческое помещение показывает сильный потенциал для долгосрочных инвестиций благодаря развивающейся инфраструктуре района и привлекательной цене. Подходит для офиса, магазина или сферы услуг.
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Modal */}
      {isOpen && activeCard && (
        <Card
          type={activeCard}
          closeSlider={closeCard}
          whereLines={whereLines}
          aboutLines={aboutLines}
          valueLines={valueLines}
          resources={resources}
        />
      )}
    </div>
  );
};

// Make global controls available
export const getRealEstateModalControls = () => globalModalControls;
