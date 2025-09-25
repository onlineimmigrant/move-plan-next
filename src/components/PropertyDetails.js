import React from 'react';
import PriceDeclaration from './PriceDeclaration';
import Map from './Map';

function PropertyDetails() {
  return (
    <div className=" mx-auto transition-all duration-300 ">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Помещение</h2>

      {/* Summary Section */}
      <section aria-labelledby="summary-heading" className="mb-10">
        <h3 id="summary-heading" className="text-2xl font-semibold text-gray-900 mb-6">
          Характеристики помещения
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
          <div className="flex items-start">
            <dt className="font-medium w-1/3 text-gray-800">Адрес:</dt>
            <dd className="w-2/3">г. Минск, ул. Петра Мстиславца 1-121, 220114</dd>
          </div>
          <div className="flex items-start">
            <dt className="font-medium w-1/3 text-gray-800">Санузел:</dt>
            <dd className="w-2/3">1</dd>
          </div>
          <div className="flex items-start">
            <dt className="font-medium w-1/3 text-gray-800">Особенности:</dt>
            <dd className="w-2/3">Вентиляция, полы с обогревом</dd>
          </div>
          <div className="flex items-start">
            <dt className="font-medium w-1/3 text-gray-800">Общая площадь:</dt>
            <dd className="w-2/3">102 м²</dd>
          </div>
        </dl>
        <p className="mt-6 text-gray-600 leading-relaxed">
          Продается престижное помещение площадью 102 м² на улице Петра Мстиславца, 1 в Минске. Идеально для офиса, салона красоты или врачебной практики. Высококлассный дизайн и расположение в элитном районе Маяк Минска делают его привлекательным для бизнеса. Уникальное предложение!
        </p>
      </section>

      {/* PriceDeclaration Section */}
      <section aria-labelledby="price-heading" className="mb-10">
        <h3 id="price-heading" className="text-2xl font-semibold text-gray-900 mb-6">
          Стоимость
        </h3>
          <PriceDeclaration />
      </section>

      {/* Map Section */}
      <section aria-labelledby="map-heading">
        <h3 id="map-heading" className="text-2xl font-semibold text-gray-900 mb-6">
          Расположение
        </h3>
        <div className="rounded-xl overflow-hidden shadow-sm">
          <Map />
        </div>
      </section>
    </div>
  );
}

export default PropertyDetails;