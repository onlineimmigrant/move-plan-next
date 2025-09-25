import React from 'react';

export const HistoryDescription: React.FC = () => {
  return (
    <div className="p-6 h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">История объекта</h2>
        <div className="w-16 h-1 bg-teal-600 rounded-full"></div>
      </div>

      {/* Timeline container */}
      <div className="space-y-8">
        {/* Current Status */}
        <div className="relative pl-8 pb-8 border-l-2 border-teal-500">
          <div className="absolute -left-3 top-0 w-6 h-6 bg-teal-500 rounded-full border-4 border-white shadow-lg"></div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Сегодня</h3>
            <p className="text-gray-600 mb-3">Объект активно предлагается на рынке</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Статус:</span>
                <span className="ml-2 text-green-600 font-medium">Активная продажа</span>
              </div>
              <div>
                <span className="text-gray-500">Цена:</span>
                <span className="ml-2 text-gray-800 font-medium">По договоренности</span>
              </div>
            </div>
          </div>
        </div>

        {/* Previous entries */}
        <div className="relative pl-8 pb-8 border-l-2 border-gray-300">
          <div className="absolute -left-3 top-0 w-6 h-6 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">6 месяцев назад</h3>
            <p className="text-gray-600 mb-3">Начало активных продаж</p>
            <div className="text-sm text-gray-500">
              Первое размещение объекта на рынке недвижимости
            </div>
          </div>
        </div>

        <div className="relative pl-8 pb-8 border-l-2 border-gray-300">
          <div className="absolute -left-3 top-0 w-6 h-6 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">1 год назад</h3>
            <p className="text-gray-600 mb-3">Завершение строительства</p>
            <div className="text-sm text-gray-500">
              Получение разрешения на ввод в эксплуатацию
            </div>
          </div>
        </div>

        <div className="relative pl-8 pb-8 border-l-2 border-gray-300">
          <div className="absolute -left-3 top-0 w-6 h-6 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">2 года назад</h3>
            <p className="text-gray-600 mb-3">Начало строительства</p>
            <div className="text-sm text-gray-500">
              Получение разрешения на строительство
            </div>
          </div>
        </div>

        {/* Start point */}
        <div className="relative pl-8">
          <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">3 года назад</h3>
            <p className="text-gray-600 mb-3">Приобретение земельного участка</p>
            <div className="text-sm text-gray-500">
              Оформление права собственности на землю
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-200">
        <h4 className="font-semibold text-teal-800 mb-2">Краткая сводка</h4>
        <p className="text-sm text-teal-700">
          Объект прошел полный цикл от приобретения земли до готового к продаже помещения. 
          История показывает стабильное развитие проекта без существенных задержек.
        </p>
      </div>
    </div>
  );
};
