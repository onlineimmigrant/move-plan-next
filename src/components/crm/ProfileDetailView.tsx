'use client';

import { useState, useMemo, useCallback } from 'react';
import AppointmentsSection from './sections/AppointmentsSection';
import SupportSection from './sections/SupportSection';
import CasesSection from './sections/CasesSection';
import ActivityTimeline from './ActivityTimeline';

// Extended profile type with customer data
interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  customer?: any;
}

interface ProfileDetailViewProps {
  profile: Profile;
  onClose: () => void;
}

type TabType = 'appointments' | 'support' | 'cases' | 'activity';

const tabs: { id: TabType; label: string }[] = [
  { id: 'appointments', label: 'Appointments' },
  { id: 'support', label: 'Support Tickets' },
  { id: 'cases', label: 'Cases' },
  { id: 'activity', label: 'Activity Timeline' },
];

export default function ProfileDetailView({ profile, onClose }: ProfileDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');

  const customerData = useMemo(() => {
    if (typeof profile.customer === 'object' && profile.customer !== null) {
      return profile.customer as Record<string, any>;
    }
    return null;
  }, [profile.customer]);

  const displayName = useMemo(() => {
    return customerData?.name || profile.full_name || profile.email || 'Unknown Customer';
  }, [customerData, profile.full_name, profile.email]);

  const displayEmail = useMemo(() => {
    return customerData?.email || profile.email || '';
  }, [customerData, profile.email]);

  const displayPhone = useMemo(() => {
    return customerData?.phone || '';
  }, [customerData]);

  const handleTabClick = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, []);

  const tabButtonStyle = useCallback((tabId: TabType) => ({
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 500,
    color: activeTab === tabId ? '#1a1a1a' : '#666',
    background: activeTab === tabId
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'transparent',
    border: 'none',
    borderBottom: activeTab === tabId ? '3px solid #667eea' : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitBackgroundClip: activeTab === tabId ? 'text' : undefined,
    WebkitTextFillColor: activeTab === tabId ? 'transparent' : undefined,
    backgroundClip: activeTab === tabId ? 'text' : undefined,
  }), [activeTab]);

  const headerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderRadius: '12px',
  }), []);

  const closeButtonStyle = useMemo(() => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }), []);

  const containerStyle = useMemo(() => ({
    width: '100%',
    height: '100vh',
    background: '#fff',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  }), []);

  const tabsContainerStyle = useMemo(() => ({
    display: 'flex',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '24px',
    gap: '8px',
  }), []);

  const contentContainerStyle = useMemo(() => ({
    flex: 1,
    overflow: 'auto',
    padding: '0 20px 20px 20px',
  }), []);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            {displayName}
          </h2>
          {displayEmail && (
            <p style={{ margin: 0, fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              📧 {displayEmail}
            </p>
          )}
          {displayPhone && (
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              📱 {displayPhone}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={closeButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#ccc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }}
        >
          Close
        </button>
      </div>

      <div style={tabsContainerStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={tabButtonStyle(tab.id)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={contentContainerStyle}>
        {activeTab === 'appointments' && <AppointmentsSection profileId={profile.id} />}
        {activeTab === 'support' && <SupportSection profileId={profile.id} />}
        {activeTab === 'cases' && <CasesSection profileId={profile.id} />}
        {activeTab === 'activity' && <ActivityTimeline profileId={profile.id} />}
      </div>
    </div>
  );
}
