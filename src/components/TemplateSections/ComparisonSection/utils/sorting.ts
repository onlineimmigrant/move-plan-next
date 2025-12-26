export const orderValue = (value: number | null | undefined): number =>
  value ?? Number.POSITIVE_INFINITY;

export const minOrderOfFeatures = (features: Array<{ order?: number | null }>): number => {
  let min = Number.POSITIVE_INFINITY;
  for (const f of features) {
    const v = orderValue(f.order);
    if (v < min) min = v;
  }
  return min;
};

export const getModuleSortKey = (moduleData: any): number => {
  const moduleOrder = orderValue(moduleData?.moduleFeature?.order);
  if (moduleOrder !== Number.POSITIVE_INFINITY) return moduleOrder;
  if (moduleData?.features?.length) return minOrderOfFeatures(moduleData.features);
  return Number.POSITIVE_INFINITY;
};

export const getHubSortKey = (hubData: any): number => {
  const moduleValues = Array.from(hubData?.modules?.values?.() ?? []);
  const moduleMin = Math.min(...moduleValues.map((m: any) => getModuleSortKey(m)));
  if (moduleMin !== Number.POSITIVE_INFINITY) return moduleMin;
  return orderValue(hubData?.hubFeature?.order);
};
