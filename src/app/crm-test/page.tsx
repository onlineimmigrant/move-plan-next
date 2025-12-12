'use client';

import { useState } from 'react';
import { ProfileDetailView } from '@/components/crm';

/**
 * Example component showing how to use the CRM ProfileDetailView
 * 
 * To test:
 * 1. Import this component into any page
 * 2. Click "Open CRM Demo" button
 * 3. The ProfileDetailView will open with test data
 * 4. Switch between tabs to see all sections
 */
export default function CRMTestPage() {
  const [showCRM, setShowCRM] = useState(false);

  // Example profile data - replace with real data from your database
  const testProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000', // Replace with real profile ID
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    customer: {
      phone: '+1 (555) 123-4567',
      name: 'John Doe',
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>CRM Integration Test</h1>
      <p>Click the button below to open the CRM ProfileDetailView component:</p>
      
      <button
        onClick={() => setShowCRM(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#fff',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Open CRM Demo
      </button>

      {showCRM && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '1200px',
              height: '90vh',
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <ProfileDetailView
              profile={testProfile}
              onClose={() => setShowCRM(false)}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>What to Expect:</h2>
        <ul>
          <li><strong>Appointments Tab:</strong> View booking stats and list of appointments</li>
          <li><strong>Support Tickets Tab:</strong> View tickets and create new ones</li>
          <li><strong>Cases Tab:</strong> View legal cases with expandable details</li>
          <li><strong>Activity Timeline Tab:</strong> See unified chronological activity feed</li>
        </ul>

        <h2>Integration Instructions:</h2>
        <ol>
          <li>Import: <code>import {`{ ProfileDetailView }`} from '@/components/crm';</code></li>
          <li>Pass a profile object with at least an <code>id</code> property</li>
          <li>Provide an <code>onClose</code> callback function</li>
          <li>The component fetches all data automatically from the API routes</li>
        </ol>

        <h2>API Routes Available:</h2>
        <ul>
          <li><code>GET /api/crm/profiles/[id]/appointments</code></li>
          <li><code>GET /api/crm/profiles/[id]/tickets</code></li>
          <li><code>POST /api/crm/profiles/[id]/tickets</code></li>
          <li><code>GET /api/crm/profiles/[id]/cases</code></li>
        </ul>
      </div>
    </div>
  );
}
