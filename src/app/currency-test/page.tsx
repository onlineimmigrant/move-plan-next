import { getPriceForCurrency } from '@/lib/currency';

// Test the currency detection logic
const testPlan = {
  id: "9735c7ea-a9d1-4730-a842-667282f719ec",
  base_currency: "USD",
  prices_multi_currency: {
    "USD": { price: 59900, symbol: "$" }, // $599.00 stored as 59900 cents
    "GBP": { price: 49900, symbol: "£" }  // £499.00 stored as 49900 cents  
  }
};

export default function CurrencyTestPage() {
  // Test different currency scenarios
  const usdPrice = getPriceForCurrency(testPlan, 'USD');
  const gbpPrice = getPriceForCurrency(testPlan, 'GBP');
  const eurPrice = getPriceForCurrency(testPlan, 'EUR'); // Should fallback to base currency

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Currency Detection Test</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-bold">Test Plan: {testPlan.id}</h2>
          <p>Base Currency: {testPlan.base_currency}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-bold">USD Price Request:</h3>
          <p>Result: {usdPrice ? `${usdPrice.symbol}${usdPrice.price} (${usdPrice.source})` : 'null'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-bold">GBP Price Request:</h3>
          <p>Result: {gbpPrice ? `${gbpPrice.symbol}${gbpPrice.price} (${gbpPrice.source})` : 'null'}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-bold">EUR Price Request (should fallback to USD):</h3>
          <p>Result: {eurPrice ? `${eurPrice.symbol}${eurPrice.price} (${eurPrice.source})` : 'null'}</p>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Expected Results:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>USD: $599.00 (multi_currency)</li>
            <li>GBP: £499.00 (multi_currency)</li>
            <li>EUR: $599.00 (multi_currency_base - fallback to USD)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}