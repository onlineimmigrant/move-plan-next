'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface CORSRule {
  AllowedOrigins: string[];
  AllowedMethods: string[];
  AllowedHeaders: string[];
  ExposeHeaders: string[];
  MaxAgeSeconds: number;
}

export default function R2CORSManagement() {
  const [loading, setLoading] = useState(false);
  const [currentCORS, setCurrentCORS] = useState<CORSRule[] | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCurrentCORS = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sync-r2-cors', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await fetch('/api/auth/session')).headers.get('authorization')}`,
        },
      });

      const data = await response.json();

      if (data.success && data.cors) {
        setCurrentCORS(data.cors);
      }
    } catch (error) {
      console.error('Failed to fetch CORS:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncCORS = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/sync-r2-cors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await fetch('/api/auth/session')).headers.get('authorization')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'R2 CORS synced successfully with organization domains!' });
        await fetchCurrentCORS();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to sync CORS' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync CORS configuration' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentCORS();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="border rounded-lg shadow-sm bg-white">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">R2 CORS Management</h2>
            <button 
              onClick={syncCORS} 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {message && (
            <div 
              className={`p-4 rounded-lg border flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">How It Works</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Automatically collects all domains from <code>organizations.domains</code></li>
              <li>Includes <code>base_url</code> and <code>base_url_local</code> fields</li>
              <li>Updates Cloudflare R2 bucket CORS policy</li>
              <li>Enables video playback from all organization domains</li>
            </ul>
          </div>

          {currentCORS && currentCORS.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Current CORS Configuration</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Allowed Origins:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentCORS[0].AllowedOrigins.map((origin, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-background px-2 py-1 rounded border"
                        >
                          {origin}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Allowed Methods:</p>
                    <div className="flex gap-1">
                      {currentCORS[0].AllowedMethods.map((method, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-background px-2 py-1 rounded border"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max Age: {currentCORS[0].MaxAgeSeconds}s</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">When to Sync</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>After adding a new organization</li>
              <li>After updating organization domains</li>
              <li>When video playback fails with CORS errors</li>
              <li>After deploying to a new domain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
