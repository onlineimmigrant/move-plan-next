'use client';

import { useEffect, useState } from 'react';
import { detectUserCurrency, getCurrencyFromLocale, getUserCurrency } from '@/lib/currency';

export default function CurrencyDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    const info = {
      // Client-side detection
      cookieCurrency: getUserCurrency(),
      localeCurrency: getCurrencyFromLocale(),
      detectedCurrency: detectUserCurrency(), // Without pricing plans
      detectedCurrencyWithPlans: detectUserCurrency(undefined, undefined, [
        { base_currency: 'GBP' }, { base_currency: 'GBP' }, { base_currency: 'EUR' }
      ]), // With sample pricing plans (2 GBP, 1 EUR - should prefer GBP)
      
      // Browser info
      navigator: {
        language: navigator.language,
        languages: navigator.languages,
      },
      
      // Document cookies
      cookies: document.cookie,
      
      // Location (if available)
      location: window.location.href,
    };
    
    setDebugInfo(info);

    // Fetch geolocation data from our debug endpoint
    fetch('/api/debug/geolocation')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to fetch geo data:', err));
  }, []);

  if (!debugInfo) return <div>Loading currency debug info...</div>;

  return (
    <div className="bg-gray-100 p-6 rounded-lg my-4 max-w-4xl">
      <h3 className="text-lg font-bold mb-4">🔍 Currency Detection Debug</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-md mb-2">Client-Side Detection:</h4>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold text-md mb-2">Server-Side Geolocation:</h4>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(geoData, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h4 className="font-semibold text-md mb-2">Quick Test:</h4>
        <p><strong>Final Detected Currency:</strong> <span className="text-lg font-bold text-blue-600">{debugInfo.detectedCurrency}</span></p>
        <p><strong>Browser Language:</strong> {debugInfo.navigator.language}</p>
        <p><strong>Cookie Currency:</strong> {debugInfo.cookieCurrency}</p>
      </div>
    </div>
  );
}