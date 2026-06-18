import { SupplyItem, CubicCertificate, SupplyRecord } from '../types';

export const INITIAL_SUPPLY_ITEMS: SupplyItem[] = [
  { code: 'سن-1', name: 'سن طبقة 1', unit: 'م٣', defaultPrice: 295 },
  { code: 'سن-2', name: 'سن طبقة 2', unit: 'م٣', defaultPrice: 295 },
  { code: 'سن-3', name: 'سن طبقة 3', unit: 'م٣', defaultPrice: 295 },
  { code: 'رمل-3', name: 'رمل طبقة 3', unit: 'م٣', defaultPrice: 280 },
  { code: 'اسمنت', name: 'أسمنت بورتلاندي', unit: 'طن', defaultPrice: 2250 },
  { code: 'بردورة', name: 'بردورة رصيف', unit: 'عدد', defaultPrice: 150 },
  { code: 'انترلوك', name: 'إنترلوك متداخل', unit: 'م٢', defaultPrice: 195 },
  { code: 'خرسانة', name: 'خرسانة جاهزة', unit: 'م٣', defaultPrice: 2480 }
];

export const INITIAL_CUBIC_CERTIFICATES: CubicCertificate[] = [];
export const INITIAL_SUPPLY_RECORDS: SupplyRecord[] = [];
