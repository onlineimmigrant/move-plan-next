import React from 'react';
import { SubsectionDisclosure } from './SubsectionDisclosure';

// Demo component to showcase the modernized subsections
export const SubsectionDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Modernized Settings Subsections</h1>
        <p className="text-gray-600">Header Settings, Menu Items, and Footer Settings with disclosure buttons</p>
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/60 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Header & Footer Settings</h2>
        
        <div className="space-y-6">
          <SubsectionDisclosure title="Header Settings" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Header Style</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                  <option>Default</option>
                  <option>Minimal</option>
                  <option>Centered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu Width</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                  <option>Small</option>
                  <option>Large</option>
                  <option>Extra Large</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm text-gray-700">Text-only Menu Items</span>
                </label>
              </div>
            </div>
          </SubsectionDisclosure>

          <SubsectionDisclosure title="Menu Items" defaultOpen={false}>
            <div className="space-y-4">
              <div className="bg-gray-50/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Navigation Menu Items</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-medium">Home</span>
                    <span className="text-xs text-gray-500">/</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-medium">About</span>
                    <span className="text-xs text-gray-500">/about</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-medium">Contact</span>
                    <span className="text-xs text-gray-500">/contact</span>
                  </div>
                </div>
              </div>
            </div>
          </SubsectionDisclosure>

          <SubsectionDisclosure title="Footer Settings" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Color</label>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-300"></div>
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                    <option>Gray 800</option>
                    <option>Neutral 900</option>
                    <option>Sky 900</option>
                  </select>
                </div>
              </div>
            </div>
          </SubsectionDisclosure>
        </div>
      </div>
    </div>
  );
};
