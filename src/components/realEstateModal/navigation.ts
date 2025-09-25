import { TabType } from './types';
import { getRealEstateModalControls } from './RealEstateModal';

/**
 * Utility functions for RealEstateModal navigation
 */

/**
 * Opens a specific RealEstateModal card/tab from anywhere in the app
 * Works reliably for both same-page and cross-page navigation
 * 
 * @param type - The tab type to open ('about', 'value', 'where', 'price')
 * 
 * Usage:
 * import { openRealEstateCard } from './components/realEstateModal/navigation';
 * 
 * // In a button click handler
 * onClick={() => openRealEstateCard('about')}
 * 
 * // In a menu item (preferred over hash links)
 * <button onClick={() => openRealEstateCard('where')}>Show Location</button>
 * 
 * // Or for menu links that must use href, use onClick to override:
 * <a href="#about" onClick={(e) => { e.preventDefault(); openRealEstateCard('about'); }}>
 */
export const openRealEstateCard = (type: TabType): void => {
  const controls = getRealEstateModalControls();
  if (controls) {
    controls.openCard(type);
  } else {
    // Fallback: use pushState to avoid browser hash formatting issues
    window.history.pushState(null, '', `#${type}`);
    // Trigger hashchange event manually
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
};

/**
 * Closes the RealEstateModal and clears the hash
 */
export const closeRealEstateCard = (): void => {
  const controls = getRealEstateModalControls();
  if (controls) {
    controls.closeCard();
  } else {
    // Fallback: clear hash
    window.history.replaceState(null, '', window.location.pathname);
  }
};

/**
 * Check if a RealEstateModal tab is currently active based on URL hash
 * @param type - The tab type to check
 * @returns boolean indicating if the tab is active
 */
export const isRealEstateCardActive = (type: TabType): boolean => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash === type;
};

/**
 * Helper function to handle menu link clicks
 * Use this in onClick handlers for menu items that need to open RealEstate tabs
 * 
 * @param e - The click event
 * @param type - The tab type to open
 * 
 * Usage in menu components:
 * <a href="#about" onClick={(e) => handleRealEstateMenuClick(e, 'about')}>
 *   Property Details
 * </a>
 */
export const handleRealEstateMenuClick = (e: React.MouseEvent, type: TabType): void => {
  e.preventDefault();
  e.stopPropagation();
  openRealEstateCard(type);
};

/**
 * Special function to handle URLs with /#format that browsers create
 * This detects if the current URL has a /#about pattern and opens the modal
 * Call this on page load or route changes
 */
export const handleSlashHashNavigation = (): void => {
  const validTypes: TabType[] = ['about', 'value', 'where', 'price'];
  const currentUrl = window.location.href;
  
  // Force cleanup of /#format URLs
  if (currentUrl.includes('/#')) {
    const urlParts = currentUrl.split('/#');
    if (urlParts.length === 2) {
      const hash = urlParts[1];
      if (validTypes.includes(hash as TabType)) {
        const cleanUrl = urlParts[0] + '#' + hash;
        window.history.replaceState(null, '', cleanUrl);
        openRealEstateCard(hash as TabType);
        return;
      }
    }
  }
  
  // Also handle current hash
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (validTypes.includes(hash as TabType)) {
    openRealEstateCard(hash as TabType);
  }
};

/**
 * Force cleanup of any /#format URLs in the current page
 * Call this manually if needed
 */
export const forceCleanupSlashHash = (): void => {
  const validTypes: TabType[] = ['about', 'value', 'where', 'price'];
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('/#')) {
    const urlParts = currentUrl.split('/#');
    if (urlParts.length === 2) {
      const hash = urlParts[1];
      if (validTypes.includes(hash as TabType)) {
        const cleanUrl = urlParts[0] + '#' + hash;
        window.history.replaceState(null, '', cleanUrl);
        console.log(`Cleaned URL from ${currentUrl} to ${cleanUrl}`);
      }
    }
  }
};
