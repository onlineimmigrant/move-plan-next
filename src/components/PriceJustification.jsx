import React from 'react';

const PriceJustification = () => {
  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
  
          <p className="text-gray-700 mb-4">
            Стоимость помещения площадью 102 м² на улице Петра Мстиславца, 1 в Минске была определена на основе анализа сопоставимых объектов недвижимости в данном районе:
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Сопоставимые объекты</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left text-gray-600">Объект</th>
                  <th className="py-2 px-4 border-b text-left text-gray-600">Площадь (м²)</th>
                  <th className="py-2 px-4 border-b text-left text-gray-600">Цена (USD)</th>
                  <th className="py-2 px-4 border-b text-left text-gray-600">Цена за м² (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border-b text-gray-700">Магазин на улице Мстиславца, 24</td>
                  <td className="py-2 px-4 border-b text-gray-700">62.4</td>
                  <td className="py-2 px-4 border-b text-gray-700">$141,937</td>
                  <td className="py-2 px-4 border-b text-gray-700">$2,274</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b text-gray-700">Производственное помещение на улице Мстиславца, 13</td>
                  <td className="py-2 px-4 border-b text-gray-700">15</td>
                  <td className="py-2 px-4 border-b text-gray-700">$32,400</td>
                  <td className="py-2 px-4 border-b text-gray-700">$2,160</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b text-gray-700 font-semibold">Средняя цена за м²</td>
                  <td className="py-2 px-4 border-b text-gray-700" colSpan="2"></td>
                  <td className="py-2 px-4 border-b text-gray-700 font-semibold">$2,217</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Оценочная стоимость с премией</h3>
          <p className="text-gray-700 mb-4">
            Для помещения площадью 102 м² базовая стоимость составляет 102 м² * $2,217 = $226,134. С учетом 20% премии за высококлассный дизайн и престижное расположение, оценочная стоимость равна $226,134 * 1.2 = $271,360.8 (или $2,660.4 за м²).
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Фактическая цена</h3>
          <p className="text-gray-700 mb-4">
            Фактическая цена продажи установлена на уровне $2,200 за м², что составляет 102 м² * $2,200 = $224,400. Эта цена ниже оценочной ($271,360.8), что делает предложение конкурентоспособным, сохраняя при этом ценность премиальных характеристик и расположения объекта.
          </p>
          <p className="text-gray-700">
            Данная цена отражает баланс между рыночными условиями, уникальными характеристиками помещения и стремлением предложить выгодное предложение для покупателей.
          </p>
        </div>
  
    </section>
  );
};

export default PriceJustification;