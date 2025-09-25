import React, { useState } from 'react';
import TextSlider from './TextSlider';
import Map from './Map';
import BlackPlanImage from '../black_plan.svg';
import PriceJustification from './PriceJustification';
import PriceDeclaration from './PriceDeclaration';
import MediaScrollPropertyPlan from './MediaScrollPropertyPlan';
import HistoryDescription from './HistoryDescription';

function Card({ type, closeSlider, whereLines, aboutLines, valueLines, resources }) {
  const [activeTab, setActiveTab] = useState('declaration'); // Track active tab for 'price' case
  const [currentLine, setCurrentLine] = useState(0); // Track the current line index

  // Determine objectType based on lines
  const getObjectType = (lines) => {
    if (!lines || lines.length === 0) return 'general';
    if (lines.some((line) => line.object_type === 'general')) {
      return 'general';
    }
    return lines[0]?.object_type || 'general';
  };

  let title, content, lines, objectType;
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
            onLineChange={(index) => setCurrentLine(index)} // Pass callback to update currentLine
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
            onLineChange={(index) => setCurrentLine(index)}
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
            onLineChange={(index) => setCurrentLine(index)}
          />
        </>
      );
      break;

    case 'price':
      title = 'Цена';
      content = (
        <>
          <div role="tablist" className="flex justify-start mb-4 border-b border-gray-200">
            <button
              role="tab"
              onClick={() => setActiveTab('declaration')}
              className={`px-4 py-2 text-sm font-medium text-gray-600 ${
                activeTab === 'declaration'
                  ? 'border-b-2 border-teal-600 text-teal-600 font-semibold'
                  : 'hover:text-teal-600'
              } transition-colors`}
              aria-selected={activeTab === 'declaration'}
              aria-label="View price declaration"
            >
              Цена
            </button>
            <button
              role="tab"
              onClick={() => setActiveTab('justification')}
              className={`px-4 py-2 text-sm font-medium text-gray-600 ${
                activeTab === 'justification'
                  ? 'border-b-2 border-teal-600 text-teal-600 font-semibold'
                  : 'hover:text-teal-600'
              } transition-colors`}
              aria-selected={activeTab === 'justification'}
              aria-label="View price justification"
            >
              Обоснование
            </button>
            <button
              role="tab"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium text-gray-600 ${
                activeTab === 'history'
                  ? 'border-b-2 border-teal-600 text-teal-600 font-semibold'
                  : 'hover:text-teal-600'
              } transition-colors`}
              aria-selected={activeTab === 'history'}
              aria-label="View price object history"
            >
              История
            </button>
            <button
              role="tab"
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm font-medium text-gray-600 ${
                activeTab === 'map'
                  ? 'border-b-2 border-teal-600 text-teal-600 font-semibold'
                  : 'hover:text-teal-600'
              } transition-colors`}
              aria-selected={activeTab === 'map'}
              aria-label="View map"
            >
              Карта
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'history' && <HistoryDescription />}
            {activeTab === 'declaration' && <PriceDeclaration />}
            {activeTab === 'justification' && <PriceJustification />}
            {activeTab === 'map' && <Map />}
          </div>
        </>
      );
      break;

    default:
      return null;
  }

  return (
    <div className="-mx-4 fixed inset-0 bg-transparent flex items-center justify-center z-30">
      <div className="bg-white p-6  sm:rounded-xl h-full sm:h-4/5 w-full sm:max-w-3xl mx-4 shadow-2xl animate-spinAround relative flex flex-col">
        <button
          onClick={closeSlider}
          className="absolute top-3 right-5 text-gray-600 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full"
          aria-label="Close"
        >
          ×
        </button>
        <h3 className="mt-4   text-2xl font-bold text-gray-800 ">{title}
        
        </h3>
        <span className=" transform  w-16 h-1 bg-teal-600 rounded-full shadow-sm" />
        
        <div className="flex-1 overflow-y-auto">{content}</div>
      </div>
    </div>
  );
}

export default Card;