# Hot Offerings - Product Card Slider Implementation

## Overview
Transformed the Hot Offerings section from accordion-style cards to product card design with slider functionality, matching the design patterns from `/products` page and slider mechanics from `/features` page.

## Changes Made

### 1. Product Card Design (from `/products` page)
The Hot Offerings section now uses the same card structure as the products listing page:

#### Card Structure:
- **Product Image**: Full-width header image (248px/208px height)
  - Uses `plan.links_to_image` from the joined product table
  - Fallback to diamond emoji (💎) with amber gradient background
  - Hover scale effect (scale-105) on image
  
- **Product Information**:
  - Product name or package name (line-clamp-2, 3rem min-height)
  - Package/measure badge (amber background)
  - Promotion badge (red background with percentage)
  - Description (line-clamp-2)
  
- **Pricing Display**:
  - Main price (2xl font, bold)
  - Strikethrough original price if promotion active
  - Promotion price shown in red if `is_promotion = true`
  - Recurring interval badge (/ month, / year)
  - Currency symbol and formatted price
  
- **Call-to-Action**:
  - Arrow icon on hover (translate-x-1 animation)
  - Entire card is clickable
  - Navigates to `/products/[product_slug]`

### 2. Slider Functionality (from `/features` page)

#### Desktop Layout (3 cards visible):
- Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Shows 3 cards simultaneously on large screens
- Shows 2 cards on medium screens (md)
- Shows 1 card on mobile

#### Slider Controls:
- **Navigation Arrows**:
  - Positioned outside the card container (left: -left-4, right: -right-4)
  - Glass morphism styling (bg-white/90, backdrop-blur)
  - Disabled state when at start/end
  - Smooth hover animations
  
- **Dot Indicators**:
  - Centered below cards
  - Active dot: amber (w-8)
  - Inactive dots: gray (w-2)
  - Number of dots = `helpCenterPricingPlans.length - 2`
  - Click to jump to specific slide

#### Slider State:
- New state: `currentOfferingSlide` (starts at 0)
- Navigation: `setCurrentOfferingSlide(prev => Math.max(0, prev - 1))`
- Max slide: `helpCenterPricingPlans.length - 3`

### 3. API Integration

The pricing plans API already provides product images via JOIN:

```typescript
.select(`
  *,
  product!product_id(
    id,
    product_name,
    slug,
    links_to_image
  )
`)
```

Transformed data includes:
- `product_name`: Product name
- `product_slug`: Product URL slug
- `links_to_image`: Product image URL

### 4. Responsive Behavior

**Mobile (< 768px)**:
- 1 card visible
- Smaller navigation arrows (w-10 h-10)
- Touch-friendly tap targets
- Full-width cards

**Tablet (768px - 1024px)**:
- 2 cards visible
- Medium arrows (w-12 h-12)

**Desktop (> 1024px)**:
- 3 cards visible
- Large arrows (w-12 h-12)
- Wider container (max-w-7xl)

## Code Structure

### Component Hierarchy:
```
Hot Offerings Section
├── Header (Title + Description)
├── Slider Container
│   ├── Cards Grid (3 visible)
│   │   └── Product Cards (map helpCenterPricingPlans)
│   │       ├── Product Image
│   │       ├── Product Info
│   │       ├── Badges (promotion, package)
│   │       ├── Pricing
│   │       └── Arrow CTA
│   ├── Navigation Arrows (left/right)
│   └── Dot Indicators
```

### Key Classes:
- **Container**: `max-w-7xl mx-auto` (wider than Featured Features)
- **Cards**: `min-h-[420px]` for consistent height
- **Image**: `h-48 sm:h-52` responsive height
- **Hover**: `hover:shadow-lg hover:scale-105` elevation effects
- **Navigation**: `w-10 h-10 sm:w-12 sm:h-12` responsive sizing

## Data Requirements

### Database Fields Used:
From `pricingplan` table:
- `id`, `product_id`, `product_name`, `product_slug`
- `links_to_image` (from joined product)
- `package`, `measure`, `description`
- `price`, `currency`, `currency_symbol`
- `is_promotion`, `promotion_price`, `promotion_percent`
- `recurring_interval`, `recurring_interval_count`
- `is_help_center` (filter for featured offerings)

### Example Query:
```sql
SELECT 
  pp.*,
  p.product_name,
  p.slug as product_slug,
  p.links_to_image
FROM pricingplan pp
JOIN product p ON pp.product_id = p.id
WHERE pp.is_help_center = true
  AND pp.is_active = true
  AND pp.organization_id = 'xxx'
LIMIT 6;
```

## Styling Differences

### From Old Design (Accordion Cards):
❌ Glass morphism effects
❌ Purple/pink gradients
❌ Expandable content
❌ Disclosure UI
❌ Inline price display

### New Design (Product Cards):
✅ Product images
✅ Clean white cards
✅ Shadow elevation
✅ Amber accent colors
✅ Full clickable cards
✅ Arrow CTAs
✅ Slider navigation

## User Experience Improvements

1. **Visual Hierarchy**: Large product images draw attention
2. **Browsing**: Slider allows viewing multiple offerings easily
3. **Clarity**: Clear pricing with promotion indicators
4. **Consistency**: Matches `/products` page design language
5. **Engagement**: Clickable cards reduce friction
6. **Mobile**: Touch-friendly navigation

## Performance Considerations

- **Lazy Loading**: Images load with `loading="lazy"`
- **Conditional Rendering**: Only renders visible slides
- **Optimized Animations**: CSS transforms (GPU-accelerated)
- **Minimal Re-renders**: State updates only affect slider position

## Accessibility

- `aria-label` on navigation buttons
- Keyboard navigation support
- Proper focus states
- Alt text on images
- Semantic HTML structure

## Testing Checklist

✅ Product images display correctly
✅ Fallback emoji shows when no image
✅ Slider navigation works (prev/next)
✅ Dot indicators update on slide change
✅ Card click navigates to product page
✅ Promotion prices display correctly
✅ Recurring interval badges show
✅ Responsive on mobile/tablet/desktop
✅ Hover effects work smoothly
✅ Disabled states on arrows at boundaries

## Future Enhancements

1. **Auto-play**: Add automatic slide rotation
2. **Touch Swipe**: Implement swipe gestures on mobile
3. **Keyboard**: Add left/right arrow key support
4. **Animation**: Add slide transition effects
5. **Loading States**: Add skeleton loaders
6. **Analytics**: Track slider engagement
7. **A/B Testing**: Compare card vs accordion performance
