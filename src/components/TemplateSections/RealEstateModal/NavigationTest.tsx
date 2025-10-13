/**
 * Simple test component to demonstrate RealEstateModal navigation
 * Place this anywhere in your app to test the navigation functionality
 */

import React from 'react';
import { openRealEstateCard, closeRealEstateCard, handleSlashHashNavigation, forceCleanupSlashHash } from './navigation';

export const RealEstateNavigationTest: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">RealEstate Modal Navigation Test</h3>
      
      <div className="space-x-2">
        <button 
          onClick={() => openRealEstateCard('about')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Open About Tab
        </button>
        
        <button 
          onClick={() => openRealEstateCard('where')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Open Location Tab
        </button>
        
        <button 
          onClick={() => openRealEstateCard('price')}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Open Price Tab
        </button>
        
        <button 
          onClick={() => openRealEstateCard('value')}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Open Value Tab
        </button>
        
        <button 
          onClick={closeRealEstateCard}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close Modal
        </button>
        
        <button 
          onClick={handleSlashHashNavigation}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Handle /#Hash URLs
        </button>
        
        <button 
          onClick={forceCleanupSlashHash}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Force Cleanup URLs
        </button>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
          These buttons will work from anywhere in your app, including same-page navigation.
        </p>
        <p className="text-sm text-gray-500">
          Try navigating to URLs like: <code>yoursite.com/#about</code> or <code>yoursite.com/page/#about</code>
        </p>
      </div>
    </div>
  );
};
