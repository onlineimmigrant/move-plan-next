import {
  buildCompetitorFeatureIndex,
  buildCompetitorPlanIndex,
  makeCompetitorFeatureKey,
} from '@/lib/comparison/indexes';
import type { ComparisonCompetitor } from '@/types/comparison';

describe('comparison indexes', () => {
  const competitors: ComparisonCompetitor[] = [
    {
      id: 'c1',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      organization_id: 'org1',
      name: 'Comp A',
      data_source: 'manual',
      sort_order: 0,
      is_active: true,
      data: {
        plans: [{ our_plan_id: 'p1', monthly: 12, yearly: 120, note: 'promo' }],
        features: [
          { our_plan_id: 'p1', our_feature_id: 'f1', status: 'available' },
          { our_plan_id: 'p1', our_feature_id: 'f2', status: 'amount', unit: 'currency', amount: '5' },
        ],
      },
    },
    {
      id: 'c2',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      organization_id: 'org1',
      name: 'Comp B',
      data_source: 'manual',
      sort_order: 1,
      is_active: true,
      data: {
        plans: [],
        features: [],
      },
    },
  ];

  it('buildCompetitorPlanIndex returns O(1) plan lookup', () => {
    const index = buildCompetitorPlanIndex(competitors);

    expect(index.get('c1')?.get('p1')?.monthly).toBe(12);
    expect(index.get('c1')?.get('p1')?.note).toBe('promo');
    expect(index.get('c2')?.get('p1')).toBeUndefined();
  });

  it('buildCompetitorFeatureIndex returns O(1) feature lookup by plan+feature key', () => {
    const index = buildCompetitorFeatureIndex(competitors);

    const f1 = index.get('c1')?.get(makeCompetitorFeatureKey('p1', 'f1'));
    expect(f1?.status).toBe('available');

    const f2 = index.get('c1')?.get(makeCompetitorFeatureKey('p1', 'f2'));
    expect(f2?.status).toBe('amount');
    expect(f2?.unit).toBe('currency');
    expect(f2?.amount).toBe('5');

    expect(index.get('c2')?.get(makeCompetitorFeatureKey('p1', 'f1'))).toBeUndefined();
  });
});
