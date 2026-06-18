export const parseArabicNumber = (str: string | number | undefined | null) => {
  if (str === null || str === undefined || str === '') return 0;
  let s = str.toString().replace(/,/g, '.').replace(/٫/g, '.');
  s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
};
