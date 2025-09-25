// Real Estate Modal Types
export interface RealEstateProperty {
  id: string;
  title: string;
  address: string;
  totalArea: number;
  bathrooms?: number;
  features?: string[];
  description?: string;
  price: {
    usd: number;
    byn: number;
    rub: number;
    eur: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MediaResource {
  public_id: string;
  resource_type: 'image' | 'video';
  object_type?: string;
}

export interface PropertyLine {
  id: string | number;
  line: string;
  object_type?: string;
  title?: string;
  description?: string;
  details?: string[];
  area?: string;
  price?: string;
  type?: string;
  rooms?: string;
  floor?: string;
  condition?: string;
}

export type TabType = 'about' | 'value' | 'where' | 'price';
export type CurrencyType = 'USD' | 'BYN' | 'RUB' | 'EUR';

export interface CardProps {
  type: TabType;
  closeSlider: () => void;
  whereLines?: PropertyLine[];
  aboutLines?: PropertyLine[];
  valueLines?: PropertyLine[];
  resources?: MediaResource[];
}

export interface TextSliderProps {
  lines?: PropertyLine[];
  resources?: MediaResource[];
  onLineChange?: (index: number) => void;
}

export interface MediaScrollPropertyPlanProps {
  lines?: PropertyLine[];
  currentLine?: number;
}

export interface PriceData {
  perM2: number;
  total: number;
  symbol: string;
}

export interface PricesState {
  USD: PriceData;
  BYN: PriceData;
  RUB: PriceData;
  EUR: PriceData;
}

export interface ExchangeRates {
  USD: PriceData;
  BYN: PriceData;
  RUB: PriceData;
  EUR: PriceData;
}

export interface ComparisonItem {
  icon: React.ReactNode;
  feature: string;
  was: string;
  now: string;
}
