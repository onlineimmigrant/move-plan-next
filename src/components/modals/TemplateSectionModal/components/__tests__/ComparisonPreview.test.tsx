import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComparisonPreview } from '@/components/modals/TemplateSectionModal/components/ComparisonPreview';
import type { ComparisonCompetitor } from '@/types/comparison';

jest.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    cssVars: {
      primary: {
        base: '#0ea5e9',
        lighter: '#e0f2fe',
      },
    },
  }),
}));

describe('ComparisonPreview', () => {
  it('renders a currency badge as CODE · SYMBOL when given a currency code', () => {
    const competitors: ComparisonCompetitor[] = [
      {
        id: 'c1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        organization_id: 'org1',
        name: 'Competitor',
        data_source: 'manual',
        sort_order: 0,
        is_active: true,
        data: {
          plans: [{ our_plan_id: 'p1', monthly: 15 }],
          features: [],
        },
      },
    ];

    render(
      <ComparisonPreview
        config={{
          competitor_ids: ['c1'],
          mode: 'pricing',
          selected_plan_id: 'p1',
          currency: 'USD',
          ui: { highlight_ours: false },
        }}
        competitors={competitors}
        pricingPlans={[{ id: 'p1', type: 'recurring', product_name: 'Pro', price: 1000 }]}
        features={[]}
        currency={'USD'}
        siteName="You"
      />
    );

    // Badge contents
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();

    // Our plan price uses the symbol, not the code
    expect(screen.getAllByText('$10').length).toBeGreaterThan(0);
  });
});
