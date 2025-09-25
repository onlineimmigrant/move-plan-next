// Centralized Yandex Maps API loader to prevent duplicate script loading

declare global {
  interface Window {
    ymaps: any;
  }
}

let isLoading = false;
let isLoaded = false;
const loadPromises: Promise<void>[] = [];

export const loadYandexMapsAPI = (): Promise<void> => {
  // If already loaded, return immediately
  if (isLoaded && window.ymaps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromises.length > 0) {
    return loadPromises[0];
  }

  // Create new loading promise
  const loadPromise = new Promise<void>((resolve, reject) => {
    // Check if API is already available
    if (window.ymaps) {
      isLoaded = true;
      resolve();
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      // Script exists, wait for it to load
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        resolve();
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create new script element
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=d58a2626-3968-4712-942e-2ecd9be03c52&lang=en_US';
    script.async = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      console.log('Yandex Maps API loaded successfully');
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      console.error('Failed to load Yandex Maps API');
      reject(new Error('Failed to load Yandex Maps API'));
    };

    document.head.appendChild(script);
  });

  isLoading = true;
  loadPromises.push(loadPromise);

  return loadPromise;
};

export const isYandexMapsLoaded = (): boolean => {
  return isLoaded && !!window.ymaps;
};
