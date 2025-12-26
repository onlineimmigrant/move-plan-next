// Currency code to symbol mapping
export const getCurrencySymbol = (code: string): string => {
  const currencyMap: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'INR': '₹',
    'RUB': '₽',
    'BRL': 'R$',
    'ZAR': 'R',
    'KRW': '₩',
    'MXN': 'MX$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'TRY': '₺',
    'AED': 'د.إ',
    'SAR': 'ر.س',
  };
  return currencyMap[code.toUpperCase()] || code;
};

export const formatMoney = (value: number): string => {
  const fixed = value.toFixed(2);
  return fixed.endsWith('.00') ? value.toFixed(0) : fixed;
};

export const formatAmount = (
  amount: string | null | undefined,
  unit: string | null | undefined
): string | null => {
  if (!amount) return null;
  const resolvedUnit = unit || 'custom';
  
  if (resolvedUnit === 'currency') {
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return amount;
    return formatMoney(numeric);
  }
  
  if (resolvedUnit === 'custom') return amount;
  return `${amount} ${resolvedUnit}`;
};
