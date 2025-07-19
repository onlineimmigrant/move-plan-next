'use client';

import { useEffect, useState } from 'react';

export default function StructuredDataValidator() {
  const [scripts, setScripts] = useState<{ id: string; type: string; content: string }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const scriptData = Array.from(jsonLdScripts).map(script => ({
        id: script.id || 'no-id',
        type: script.getAttribute('type') || '',
        content: script.textContent || ''
      }));
      setScripts(scriptData);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        JSON-LD Scripts in DOM: {scripts.length}
      </h3>
      
      {scripts.length === 0 ? (
        <p className="text-yellow-700">No JSON-LD scripts found in document head</p>
      ) : (
        <div className="space-y-2">
          {scripts.map((script, index) => (
            <div key={index} className="bg-white p-2 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Script ID: {script.id} | Type: {script.type}
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {script.content}
              </pre>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs text-yellow-600">
        This validator checks every second for JSON-LD scripts in the document head.
        <br />
        Test with Google Rich Results: <a 
          href="https://search.google.com/test/rich-results" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          https://search.google.com/test/rich-results
        </a>
      </div>
    </div>
  );
}
