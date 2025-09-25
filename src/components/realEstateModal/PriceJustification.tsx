import React from 'react';

export const PriceJustification: React.FC = () => {
  return (
    <div className="p-6 h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Обоснование цены</h2>
        <div className="w-16 h-1 bg-teal-600 rounded-full"></div>
        <p className="text-gray-600 mt-3">
          Детальный анализ факторов, влияющих на стоимость объекта
        </p>
      </div>

      {/* Factors affecting price */}
      <div className="space-y-6">
        {/* Location factors */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Факторы местоположения
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Престижность района:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-16 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Высокая</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Транспортная доступность:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-18 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Отличная</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Инфраструктура:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-16 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Хорошая</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Экология:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-14 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Хорошая</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Безопасность:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-18 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Высокая</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Развитие района:</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div className="w-16 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Активное</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Object characteristics */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Характеристики объекта
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Технические параметры</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Год постройки:</span>
                  <span className="font-medium text-gray-800">2023 (новостройка)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Материал стен:</span>
                  <span className="font-medium text-gray-800">Кирпич-монолит</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Высота потолков:</span>
                  <span className="font-medium text-gray-800">3.2 м</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Отделка:</span>
                  <span className="font-medium text-gray-800">Черновая</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Лифт:</span>
                  <span className="font-medium text-gray-800">Пассажирский + грузовой</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Дополнительные преимущества</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Индивидуальное отопление</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Подземная парковка</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Консьерж-сервис</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Видеонаблюдение</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Благоустроенная территория</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market comparison */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Сравнение с рынком
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xl font-bold text-red-600 mb-1">120,000 ₽/м²</div>
              <div className="text-sm text-red-700">Средняя цена по району</div>
              <div className="text-xs text-red-600 mt-1">+5% к нашей цене</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xl font-bold text-blue-600 mb-1">115,000 ₽/м²</div>
              <div className="text-sm text-blue-700">Аналогичные новостройки</div>
              <div className="text-xs text-blue-600 mt-1">Наш уровень</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl font-bold text-green-600 mb-1">110,000 ₽/м²</div>
              <div className="text-sm text-green-700">Наше предложение</div>
              <div className="text-xs text-green-600 mt-1">-4% от рынка</div>
            </div>
          </div>
        </div>

        {/* Investment potential */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Инвестиционный потенциал
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Прогноз роста стоимости</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1 год:</span>
                  <span className="font-medium text-green-600">+8-12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">3 года:</span>
                  <span className="font-medium text-green-600">+25-35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">5 лет:</span>
                  <span className="font-medium text-green-600">+45-60%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Доходность от аренды</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Месячная аренда:</span>
                  <span className="font-medium text-gray-800">45,000 - 55,000 ₽</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Годовая доходность:</span>
                  <span className="font-medium text-blue-600">4.8 - 5.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Окупаемость:</span>
                  <span className="font-medium text-purple-600">18-21 год</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-teal-50 rounded-lg p-4 border border-teal-200">
        <h4 className="font-semibold text-teal-800 mb-2">Вывод</h4>
        <p className="text-sm text-teal-700">
          Цена объекта обоснована высоким качеством строительства, престижным районом 
          и отличной инфраструктурой. Стоимость на 4% ниже среднерыночной, что делает 
          предложение привлекательным как для проживания, так и для инвестиций.
        </p>
      </div>
    </div>
  );
};
