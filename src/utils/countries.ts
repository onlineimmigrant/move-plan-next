export function getCountryNameByCode(code: string): string {
    const countryMap: { [key: string]: string } = {
      US: 'United States',
      EU: 'European Union',
      GB: 'United Kindgom',
 
    };
    return countryMap[code.toUpperCase()] || code;
  }

