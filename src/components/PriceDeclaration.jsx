import React, { useState, useEffect } from 'react';

const PriceDeclaration = () => {
  const [currency, setCurrency] = useState('USD'); // Track current currency: USD, BYN, RUB, EUR
  const [prices, setPrices] = useState({
    USD: { perM2: 2200, total: 224400, symbol: '$' },
    BYN: { perM2: 7150, total: 729300, symbol: 'BYN' }, // Fallback: 1 USD ≈ 3.3 BYN
    RUB: { perM2: 202400, total: 20644800, symbol: 'RUB' }, // Fallback: 1 USD ≈ 92 RUB
    EUR: { perM2: 2090, total: 213180, symbol: '€' }, // Fallback: 1 USD ≈ 0.95 EUR
  });
  const [error, setError] = useState(null);

  // Fetch real-time exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(
          'https://api.exchangerate-api.com/v4/latest/USD?apiKey=YOUR_API_KEY'
        );
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();
        const bynRate = data.rates.BYN || 3.3; // Fallback if rate unavailable
        const rubRate = data.rates.RUB || 92; // Fallback if rate unavailable
        const eurRate = data.rates.EUR || 0.95; // Fallback if rate unavailable
        setPrices({
          USD: { perM2: 2200, total: 224400, symbol: '$' },
          BYN: {
            perM2: Math.round(2200 * bynRate),
            total: Math.round(224400 * bynRate),
            symbol: 'BYN',
          },
          RUB: {
            perM2: Math.round(2200 * rubRate),
            total: Math.round(224400 * rubRate),
            symbol: 'RUB',
          },
          EUR: {
            perM2: Math.round(2200 * eurRate),
            total: Math.round(224400 * eurRate),
            symbol: '€',
          },
        });
      } catch (err) {
        console.error('Exchange rate fetch error:', err);
        setError('Не удалось загрузить курсы валют. Используются стандартные значения.');
      }
    };
    fetchExchangeRates();
  }, []);

  return (
    <div className="py-4 text-gray-800">
      <p className="text-base text-gray-700 mb-8">
        Законодательство Беларуси позволяет проводить сделки исключительно в белорусских рублях (BYN). 
        Доллар США (USD), российские рубли (RUB) и евро (EUR) приводятся в качестве эквивалента.
      </p>
      {error && (
        <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
      )}
      <div className="flex justify-center mb-4 space-x-2">
        {['USD', 'BYN', 'RUB', 'EUR'].map((curr) => (
          <button
            key={curr}
            onClick={() => setCurrency(curr)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              currency === curr
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200`}
            aria-label={`View price in ${curr}`}
            aria-pressed={currency === curr}
          >
            {curr}
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <div className="bg-white   p-6 pb-12 w-full text-center">
          <div className="mb-4">
            <p className="text-3xl font-semibold text-teal-600">
              {prices[currency].symbol}
            </p>
          </div>
          <div className="sm:flex justify-between items-center space-y-8  gap-x-4 sm:space-y-0">
            <div className="flex-1 border-2 rounded-full py-2 ">
              <p className="text-xl font-medium text-gray-600">м²</p>
              <p className="  text-4xl font-bold text-teal-600">
                {prices[currency].perM2.toLocaleString()}
              </p>
            </div>
            <div className="flex-1  ">
                <div className='border-2  rounded-full py-2'>
              <p className="text-xl font-medium text-gray-600">102 м²</p>
              <p className=" text-4xl font-bold text-teal-600">
                {prices[currency].total.toLocaleString()}
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceDeclaration;