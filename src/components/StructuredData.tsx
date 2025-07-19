'use client';

import { useEffect } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
  id: string;
}

export default function StructuredData({ data, id }: StructuredDataProps) {
  useEffect(() => {
    console.log('StructuredData: useEffect triggered for', id, data);
    
    // Create the script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.innerHTML = JSON.stringify(data, null, 2);
    
    // Remove any existing script with the same ID
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
      console.log('StructuredData: Removed existing script', id);
    }
    
    // Add to head
    document.head.appendChild(script);
    console.log('StructuredData: Added script to head', id);
    
    // Verify it was added
    const verifyScript = document.getElementById(id);
    console.log('StructuredData: Verification - script exists in DOM:', !!verifyScript);
    
    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
        console.log('StructuredData: Cleanup - removed script', id);
      }
    };
  }, [data, id]);

  return null; // This component doesn't render anything visible
}
