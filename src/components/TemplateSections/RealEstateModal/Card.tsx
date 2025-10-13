import React, { useState, useEffect } from 'react';
import { CardProps } from './types';
import { TextSlider } from './TextSlider';
import { Map } from './Map';
import { PriceDeclaration } from './PriceDeclaration';
import { MediaScrollPropertyPlan } from './MediaScrollPropertyPlan';

/**
 * Card component with reliable navigation support
 * 
 * Supports navigation to different tabs:
 * - about - Property details tab
 * - value - Property value tab  
 * - where - Location/address tab
 * - price - Pricing information tab
 * 
 * Recommended usage (works reliably for same-page navigation):
 * import { openRealEstateCard } from './navigation';
 * 
 * <button onClick={() => openRealEstateCard('about')}>
 *   View Property Details
 * </button>
 * 
 * Direct hash links work for cross-page navigation:
 * <a href="#about">Property Details</a>
 */

export const Card: React.FC<CardProps> = ({ 
  type, 
  closeSlider, 
  whereLines = [], 
  aboutLines = [], 
  valueLines = [], 
  resources = [] 
}) => {
  const [currentLine, setCurrentLine] = useState<number>(0);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      // If hash doesn't match current type or is empty, close the modal
      if (hash !== type) {
        closeSlider();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [type, closeSlider]);

  // Simple close handler
  const handleClose = () => {
    closeSlider();
  };

  // Determine objectType based on lines
  const getObjectType = (lines: any[]): string => {
    if (!lines || lines.length === 0) return 'general';
    if (lines.some((line) => line.object_type === 'general')) {
      return 'general';
    }
    return lines[0]?.object_type || 'general';
  };

  let title: string;
  let content: React.ReactNode;
  let lines: any[];
  let objectType: string;

  switch (type) {
    case 'about':
      title = 'О помещении';
      lines = aboutLines;
      objectType = getObjectType(aboutLines);
      content = (
        <>
          <MediaScrollPropertyPlan lines={lines} currentLine={currentLine} />
          <TextSlider
            lines={lines}
            resources={resources}
            onLineChange={(index: number) => setCurrentLine(index)}
          />
        </>
      );
      break;

    case 'value':
      title = 'Ценность';
      lines = valueLines;
      objectType = getObjectType(valueLines);
      content = (
        <div className="py-16 text-2xl">
          <TextSlider
            lines={lines}
            resources={resources}
            onLineChange={(index: number) => setCurrentLine(index)}
          />
        </div>
      );
      break;

    case 'where':
      title = 'Адрес';
      lines = whereLines;
      objectType = getObjectType(whereLines);
      content = (
        <>
          <Map />
          <TextSlider
            lines={lines}
            resources={resources}
            onLineChange={(index: number) => setCurrentLine(index)}
          />
        </>
      );
      break;

    case 'price':
      title = 'Цена';
      content = (
        <PriceDeclaration />
      );
      break;

    default:
      return null;
  }

  return (
    <div className="sm:-mx-4 fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 sm:rounded-xl h-full sm:h-4/5 w-full sm:max-w-3xl mx-0 sm:mx-4 shadow-2xl animate-spinAround relative flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-3 right-5 text-gray-600 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full"
          aria-label="Close"
        >
          ×
        </button>
        <h3 className="mt-2 text-xl sm:text-2xl font-bold text-gray-800">{title}</h3>
        <span className="mb-4 transform w-16 h-1 bg-teal-600 rounded-full shadow-sm" />
        
        <div className="flex-1 overflow-y-auto min-h-0">{content}</div>
      </div>
    </div>
  );
};
