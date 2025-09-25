import React, { useState } from 'react';
import { MediaScrollPropertyPlanProps } from './types';
import propertyData from './property.json';
import propertyPlanData from './property_plan.json';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  object_type: string;
}

export const MediaScrollPropertyPlan: React.FC<MediaScrollPropertyPlanProps> = ({ 
  lines = [], 
  currentLine = 0 
}) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'plans' | 'photos' | 'videos'>('plans');

  // Convert JSON data to MediaItem format
  const convertToMediaItems = (resources: any[], isPlans: boolean = false): MediaItem[] => {
    return resources.map((resource, index) => {
      const fileName = resource.public_id.split('/').pop() || `media-${index}`;
      const nameWithoutExt = fileName.split('.')[0];
      
      let title = '';
      let description = '';
      
      if (isPlans) {
        // Handle plan SVGs
        if (nameWithoutExt.includes('property_plan_clean')) {
          title = 'Общий план помещения';
          description = 'Полная планировка объекта';
        } else if (nameWithoutExt.includes('102m_plan')) {
          title = 'План 102м²';
          description = 'Детальная планировка помещения';
        } else if (nameWithoutExt.includes('room_1_plan')) {
          title = 'План комнаты 1';
          description = 'Планировка первой комнаты';
        } else if (nameWithoutExt.includes('room_2_plan')) {
          title = 'План комнаты 2';
          description = 'Планировка второй комнаты';
        } else if (nameWithoutExt.includes('room_3_plan')) {
          title = 'План комнаты 3';
          description = 'Планировка третьей комнаты';
        } else if (nameWithoutExt.includes('room_4_plan')) {
          title = 'План комнаты 4';
          description = 'Планировка четвертой комнаты';
        } else if (nameWithoutExt.includes('toilet_plan')) {
          title = 'План санузла';
          description = 'Планировка туалета';
        } else if (nameWithoutExt.includes('kitchen_plan')) {
          title = 'План кухни';
          description = 'Планировка кухонной зоны';
        } else if (nameWithoutExt.includes('entrance')) {
          title = 'План входной зоны';
          description = 'Планировка входа и коридора';
        } else {
          title = 'Планировка';
          description = 'Архитектурный план';
        }
      } else {
        // Handle photos and videos
        if (resource.object_type === 'general') {
          title = 'Общий вид';
          description = 'Обзор объекта недвижимости';
        } else if (resource.object_type === 'entrance') {
          title = 'Вход и лифт';
          description = 'Входная группа и лифтовая зона';
        } else if (resource.object_type.startsWith('room_')) {
          const roomNum = resource.object_type.split('_')[1];
          title = `Комната ${roomNum}`;
          description = `Фотографии ${roomNum}-й комнаты`;
        } else {
          title = 'Фото объекта';
          description = 'Изображение помещения';
        }
      }

      return {
        id: `${resource.object_type}-${index}`,
        type: resource.resource_type,
        url: resource.public_id,
        title,
        description,
        object_type: resource.object_type
      };
    });
  };

  // Combine plans, photos, and videos
  const planMedia = convertToMediaItems(propertyPlanData.resources, true);
  const allPropertyMedia = convertToMediaItems(propertyData.resources, false);
  const photoMedia = allPropertyMedia.filter(item => item.type === 'image');
  const videoMedia = allPropertyMedia.filter(item => item.type === 'video');
  
  const currentMedia = activeTab === 'plans' ? planMedia : activeTab === 'photos' ? photoMedia : videoMedia;
  const currentLineData = lines[currentLine];

  return (
    <div className="bg-white rounded-lg px-6 py-4 shadow-sm border border-gray-200 mb-4">
      {/* Header with tabs */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {activeTab === 'plans' ? 'Планы помещения' : 
           activeTab === 'photos' ? 'Фотографии объекта' : 
           'Видео обзор'}
        </h3>
        <div className="text-sm text-gray-500">
          {selectedMediaIndex + 1} из {currentMedia.length}
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => {
            setActiveTab('plans');
            setSelectedMediaIndex(0);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'plans'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Планы ({planMedia.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('photos');
            setSelectedMediaIndex(0);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'photos'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Фото ({photoMedia.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('videos');
            setSelectedMediaIndex(0);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'videos'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Видео ({videoMedia.length})
        </button>
      </div>

      {/* Main media display */}
      <div className="relative mb-4">
        <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px' }}>
          {currentMedia.length > 0 ? (
            currentMedia[selectedMediaIndex]?.type === 'video' ? (
              <video
                src={currentMedia[selectedMediaIndex].url}
                controls
                className="max-w-full max-h-96 object-contain"
                poster={currentMedia[selectedMediaIndex].url.replace('.mp4', '_poster.jpg')}
              >
                Ваш браузер не поддерживает видео.
              </video>
            ) : (
              <img
                src={currentMedia[selectedMediaIndex].url}
                alt={currentMedia[selectedMediaIndex].title}
                className="max-w-full max-h-96 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-property.jpg';
                }}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-600 font-medium">
                  {activeTab === 'plans' ? 'Планы не найдены' : 
                   activeTab === 'photos' ? 'Фотографии не найдены' : 
                   'Видео не найдены'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Media navigation arrows */}
        {currentMedia.length > 1 && (
          <>
            <button
              onClick={() => setSelectedMediaIndex(prev => 
                prev === 0 ? currentMedia.length - 1 : prev - 1
              )}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-opacity-100 transition-all"
              aria-label="Previous media"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedMediaIndex(prev => 
                prev === currentMedia.length - 1 ? 0 : prev + 1
              )}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-opacity-100 transition-all"
              aria-label="Next media"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Media type and title overlay */}
        {currentMedia.length > 0 && (
          <>
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {activeTab === 'plans' ? 'ПЛАН' : 
               currentMedia[selectedMediaIndex]?.type === 'image' ? 'ФОТО' : 'ВИДЕО'}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded max-w-xs">
              <h4 className="font-medium">{currentMedia[selectedMediaIndex]?.title}</h4>
              <p className="text-xs opacity-80">{currentMedia[selectedMediaIndex]?.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail navigation */}
      {currentMedia.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
          {currentMedia.map((media, index) => (
            <button
              key={media.id}
              onClick={() => setSelectedMediaIndex(index)}
              className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-colors relative overflow-hidden ${
                index === selectedMediaIndex 
                  ? 'border-teal-600' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Property details related to current line */}
      {currentLineData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Характеристики помещения</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Площадь:</span>
              <div className="font-medium text-gray-800">
                {currentLineData.area || '85 м²'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Комнаты:</span>
              <div className="font-medium text-gray-800">
                {currentLineData.rooms || '3'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Этаж:</span>
              <div className="font-medium text-gray-800">
                {currentLineData.floor || '5/12'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Состояние:</span>
              <div className="font-medium text-gray-800">
                {currentLineData.condition || 'Новое'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3 mt-4">
        <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
          Скачать планы
        </button>
        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
          Виртуальный тур
        </button>
      </div>
    </div>
  );
};
