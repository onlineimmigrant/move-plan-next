import React, { useState, useEffect } from 'react';
import { TextSliderProps } from './types';

export const TextSlider: React.FC<TextSliderProps> = ({ 
  lines = [], 
  resources = [], 
  onLineChange 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (onLineChange) {
      onLineChange(currentIndex);
    }
  }, [currentIndex, onLineChange]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(lines.length - 1, 0) : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === lines.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!lines || lines.length === 0) {
    return (
      <div className="text-center ">
        <p className="text-gray-500"></p>
      </div>
    );
  }

  const currentLine = lines[currentIndex];

  return (
    <div className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {/* Navigation arrows */}
      {lines.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Content */}
      <div className="mx-8">
        {/* Title */}
        {currentLine?.title && (
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {currentLine.title}
          </h3>
        )}

        {/* Description */}
        {currentLine?.description && (
          <div className="text-gray-700 mb-4 leading-relaxed">
            {currentLine.description.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className={index > 0 ? 'mt-3' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Additional details */}
        {currentLine?.details && Array.isArray(currentLine.details) && (
          <div className="space-y-2 mb-4">
            {currentLine.details.map((detail: any, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        {(currentLine?.area || currentLine?.price || currentLine?.type) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {currentLine.area && (
              <div>
                <span className="text-gray-500 text-sm">Площадь:</span>
                <div className="font-medium text-gray-800">{currentLine.area} м²</div>
              </div>
            )}
            {currentLine.price && (
              <div>
                <span className="text-gray-500 text-sm">Цена:</span>
                <div className="font-medium text-gray-800">{currentLine.price}</div>
              </div>
            )}
            {currentLine.type && (
              <div>
                <span className="text-gray-500 text-sm">Тип:</span>
                <div className="font-medium text-gray-800">{currentLine.type}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination dots */}
      {lines.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {lines.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-teal-600' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {lines.length > 1 && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {lines.length}
        </div>
      )}

      {/* Associated resources indicator */}
      {resources && resources.length > 0 && (
        <div className="absolute top-4 left-4">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-teal-600 font-medium">{resources.length} медиа</span>
          </div>
        </div>
      )}
    </div>
  );
};
