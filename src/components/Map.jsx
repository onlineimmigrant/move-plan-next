import React, { useState, useEffect, useRef } from 'react';
import { loadYandexMapsAPI } from '../utils/yandexMapsLoader';

function Map() {
  const [mapType, setMapType] = useState('map'); // 'map' or 'panorama'
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [hasPanorama, setHasPanorama] = useState(null); // Track panorama availability
  const mapInstanceRef = useRef(null); // Store map/panorama instance
  const mapContainerRef = useRef(null); // Reference to map container

  // Load Yandex Maps API script once using centralized loader
  useEffect(() => {
    loadYandexMapsAPI()
      .then(() => {
        setIsScriptLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Yandex Maps API:', err);
        setError('Failed to load map. Please check your API key or internet connection.');
      });
  }, []);

  // Initialize map or panorama
  useEffect(() => {
    if (!isScriptLoaded || !window.ymaps || !mapContainerRef.current) return;

    window.ymaps.ready(() => {
      // Reset error state on new initialization attempt
      setError(null);

      // Destroy previous map/panorama instance if it exists
      if (mapInstanceRef.current) {
        if (mapInstanceRef.current.destroy) {
          mapInstanceRef.current.destroy();
        }
        mapInstanceRef.current = null;
      }

      // Check panorama availability only once
      if (hasPanorama === null) {
        window.ymaps.panorama.locate([53.928535, 27.654304]).then(
          (panoramas) => {
            console.log('Panorama check:', panoramas.length, 'found');
            setHasPanorama(panoramas.length > 0);
          },
          (err) => {
            console.error('Panorama availability check failed:', err);
            setHasPanorama(false);
          }
        );
      }

      // Initialize map or panorama based on mapType
      if (mapType === 'map' || (mapType === 'panorama' && !hasPanorama)) {
        try {
          const map = new window.ymaps.Map(mapContainerRef.current, {
            center: [53.928535, 27.654304], // Minsk, Petra Mstislavca 1
            zoom: 15,
            controls: ['zoomControl', 'fullscreenControl'],
          });
          map.geoObjects.add(
            new window.ymaps.Placemark([53.928535, 27.654304], {
              balloonContent:
                mapType === 'map'
                  ? 'Belarus, Minsk, Petra Mstislavca 1'
                  : 'Belarus, Minsk, Petra Mstislavca 1 (Street panorama not available)',
              hintContent: 'Property Location',
            })
          );
          mapInstanceRef.current = map;
        } catch (err) {
          console.error('Map initialization error:', err);
          setError('Failed to initialize map. Please try again.');
        }
      } else if (mapType === 'panorama' && hasPanorama) {
        window.ymaps.panorama.locate([53.928535, 27.654304]).then(
          (panoramas) => {
            if (panoramas.length) {
              try {
                const player = new window.ymaps.panorama.Player(mapContainerRef.current, panoramas[0], {
                  autoFit: true,
                  controls: ['panoramaControl', 'zoomControl'],
                  direction: [0, 10],
                });
                mapInstanceRef.current = player;
              } catch (err) {
                console.error('Panorama player error:', err);
                setError('Failed to load street panorama. Switching to map view.');
                setMapType('map');
              }
            } else {
              console.warn('No panorama available at this location');
              setError('Street panorama not available for this location.');
              setMapType('map');
            }
          },
          (err) => {
            console.error('Panorama locate error:', err);
            setError('Failed to load street panorama: ' + err.message);
            setMapType('map');
          }
        );
      }
    });
  }, [isScriptLoaded, mapType, hasPanorama]);

  // Handle loading and error states
  if (error) {
    return (
      <div className="w-full h-64 rounded-lg mt-6 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!isScriptLoaded) {
    return (
      <div className="w-full h-64 rounded-lg mt-6 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-center mb-4 space-x-4">
        <button
          onClick={() => setMapType('map')}
          className={`px-4 py-2 rounded-full text-white ${
            mapType === 'map' ? 'bg-teal-600' : 'bg-gray-400'
          } hover:bg-teal-700 transition-colors`}
          aria-label="Switch to standard map"
        >
          Карта
        </button>
        <button
          onClick={() => setMapType('panorama')}
          className={`px-4 py-2 rounded-full text-white ${
            mapType === 'panorama' ? 'bg-teal-600' : 'bg-gray-400'
          } hover:bg-teal-700 transition-colors ${
            hasPanorama === false ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Switch to street panorama"
          disabled={hasPanorama === false}
        >
          Уличная Панорама
        </button>
      </div>
      <div
        ref={mapContainerRef}
        id="map"
        className="w-full h-96 rounded-lg"
        aria-label="Map of Minsk, Petra Mstislavca 1"
      />
    </div>
  );
}

export default Map;