import React from 'react';
import {
  BoltIcon,
  CloudArrowDownIcon,
  BeakerIcon, // Replaced DropletIcon
  FireIcon,
  CpuChipIcon,
  ArrowPathIcon,
  WindowIcon,
  HomeIcon, // Replaced DoorIcon
  BuildingOfficeIcon,
  BuildingStorefrontIcon, // Using as a placeholder for KitchenIcon
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';

const comparisonData = [
  {
    icon: <BoltIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Электричество',
    was: '1 кВт, 220 Вт, одна розетка и лампочка',
    now: '20 кВт, 380 Вт, подходит для производственных нужд',
  },
  {
    icon: <CloudArrowDownIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Канализация',
    was: 'Отсутствовала',
    now: 'Подключена, включая магистральную для производственных стоков',
  },
  {
    icon: <BeakerIcon className="h-6 w-6 text-gray-600" />, // Updated icon
    feature: 'Водоснабжение',
    was: 'Отсутствовало',
    now: 'Подключено',
  },
  {
    icon: <FireIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Отопление',
    was: 'Отсутствовало',
    now: 'Тёплый водяной пол по всей площади',
  },
  {
    icon: <CpuChipIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Кондиционирование',
    was: 'Отсутствовало',
    now: 'Установлено кондиционирование и тепловая завеса',
  },
  {
    icon: <ArrowPathIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Вентиляция',
    was: 'Отсутствовала',
    now: 'Приточно-вытяжная вентиляция',
  },
  {
    icon: <WindowIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Окна',
    was: 'Старые пластиковые окна',
    now: 'Алюминиевые конструкции, проёмы увеличены вдвое',
  },
  {
    icon: <HomeIcon className="h-6 w-6 text-gray-600" />, // Updated icon
    feature: 'Двери',
    was: 'Несоответствовали нормам',
    now: 'Цельностеклянные двери и перегородки, новая входная группа',
  },
  {
    icon: <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Санузел',
    was: 'Отсутствовал',
    now: 'Полноценный санузел',
  },
  {
    icon: <BuildingStorefrontIcon className="h-6 w-6 text-gray-600" />, // Placeholder for kitchen
    feature: 'Мини-кухня',
    was: 'Отсутствовала',
    now: 'Оборудована',
  },
  {
    icon: <ArrowRightCircleIcon className="h-6 w-6 text-gray-600" />,
    feature: 'Входная группа',
    was: 'Не соответствовала эксплуатационным и эстетическим требованиям',
    now: 'Полностью реконструирована, с гидроизоляцией и приямками',
  },
];

const HistoryDescriptionComparison = () => {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Что было и что стало</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Характеристика</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Что было</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Что стало</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="py-4 px-4 flex items-center space-x-3">
                  {item.icon}
                  <span className="text-gray-800">{item.feature}</span>
                </td>
                <td className="py-4 px-4 text-gray-600">{item.was}</td>
                <td className="py-4 px-4 text-gray-600">{item.now}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryDescriptionComparison;