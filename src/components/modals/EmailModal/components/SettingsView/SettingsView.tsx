'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ConnectedAccounts from './ConnectedAccounts';
import SenderAddresses from './SenderAddresses';
import SESConfiguration from './SESConfiguration';
import BrandingEditor from './BrandingEditor';
import DomainSetup from './DomainSetup';
import SignatureEditor from './SignatureEditor';
import { 
  Mail, 
  Cloud, 
  Palette, 
  Globe, 
  PenTool,
  ChevronDown,
  AtSign
} from 'lucide-react';

type SettingsTab = 'accounts' | 'senders' | 'ses' | 'branding' | 'domain' | 'signature';

interface SettingsViewProps {
  primary: { base: string; hover: string };
}

export default function SettingsView({ primary }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const tabs = [
    { id: 'accounts' as const, label: 'Connected Accounts', icon: Mail },
    { id: 'domain' as const, label: 'Domain Setup', icon: Globe },
    { id: 'senders' as const, label: 'Sender Addresses', icon: AtSign },
    { id: 'ses' as const, label: 'AWS SES', icon: Cloud },
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'signature' as const, label: 'Signature', icon: PenTool },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveIcon = activeTabData?.icon || Mail;

  const handleTabSelect = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  // Find portal container on mount
  useEffect(() => {
    const container = document.getElementById('settings-mobile-menu-container');
    setPortalContainer(container);
  }, []);

  // Mobile menu component
  const mobileMenu = (
    <div className="relative">
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          <ActiveIcon className="w-5 h-5" />
          <span className="font-medium text-sm">{activeTabData?.label}</span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showMobileMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                style={isActive ? { color: primary.base } : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Mobile Dropdown Menu - Portaled to bottom panel */}
      {portalContainer && createPortal(mobileMenu, portalContainer)}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block w-64 border-r border-white/20 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                !isActive
                  ? 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                  : ''
              }`}
              style={isActive ? {
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              } : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === 'accounts' && <ConnectedAccounts primary={primary} />}
        {activeTab === 'senders' && <SenderAddresses primary={primary} />}
        {activeTab === 'ses' && <SESConfiguration primary={primary} />}
        {activeTab === 'branding' && <BrandingEditor primary={primary} />}
        {activeTab === 'domain' && <DomainSetup primary={primary} />}
        {activeTab === 'signature' && <SignatureEditor primary={primary} />}
      </div>
    </div>
  );
}
