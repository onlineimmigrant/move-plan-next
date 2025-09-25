/**
 * Global hash cleanup script
 * Add this to your layout.tsx or _app.tsx to automatically clean /#hash URLs
 */

'use client';

import { useEffect } from 'react';

export const GlobalHashCleanup = () => {
  useEffect(() => {
    const cleanupHash = () => {
      const validTypes = ['about', 'value', 'where', 'price'];
      const currentUrl = window.location.href;
      
      if (currentUrl.includes('/#')) {
        const urlParts = currentUrl.split('/#');
        if (urlParts.length === 2) {
          const hash = urlParts[1];
          if (validTypes.includes(hash)) {
            const cleanUrl = urlParts[0] + '#' + hash;
            window.history.replaceState(null, '', cleanUrl);
            console.log(`Auto-cleaned URL: ${currentUrl} → ${cleanUrl}`);
          }
        }
      }
    };

    // Run immediately
    cleanupHash();
    
    // Run on hash changes
    window.addEventListener('hashchange', cleanupHash);
    
    return () => {
      window.removeEventListener('hashchange', cleanupHash);
    };
  }, []);

  return null; // This component doesn't render anything
};

/**
 * Usage in your layout.tsx or app component:
 * 
 * import { GlobalHashCleanup } from './components/realEstateModal/GlobalHashCleanup';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <GlobalHashCleanup />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */
