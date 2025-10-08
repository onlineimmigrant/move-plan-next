# SliderNavigation Component

A universal, reusable slider navigation component for consistent carousel/slider controls across the project.

## Features

- **Navigation Buttons**: Previous/Next chevron buttons with multiple positioning options
- **Dot Indicators**: Visual indicators showing current slide position
- **Multiple Variants**: Different button and dot styles to match different design contexts
- **Fully Customizable**: Position, style, and visibility options
- **Responsive**: Desktop-only buttons (hidden on mobile)
- **Accessible**: Proper ARIA labels and keyboard navigation support

## Usage

```tsx
import { SliderNavigation } from '@/components/ui/SliderNavigation';

<SliderNavigation
  onPrevious={handlePrevious}
  onNext={handleNext}
  currentIndex={currentIndex}
  totalItems={items.length}
  onDotClick={handleDotClick}
  showDots={true}
  buttonPosition="bottom-right"
  buttonVariant="minimal"
  dotVariant="default"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPrevious` | `() => void` | **required** | Function to call when previous button is clicked |
| `onNext` | `() => void` | **required** | Function to call when next button is clicked |
| `currentIndex` | `number` | **required** | Current active slide index (0-based) |
| `totalItems` | `number` | **required** | Total number of slides |
| `onDotClick` | `(index: number) => void` | `undefined` | Function to call when dot is clicked |
| `showDots` | `boolean` | `true` | Whether to show dot indicators |
| `dotPosition` | `'center' \| 'left' \| 'right'` | `'center'` | Horizontal alignment of dots |
| `buttonPosition` | `'bottom-right' \| 'bottom-center' \| 'sides' \| 'top-right'` | `'bottom-right'` | Position of navigation buttons |
| `buttonVariant` | `'default' \| 'circle' \| 'minimal'` | `'default'` | Style variant for buttons |
| `dotVariant` | `'default' \| 'large'` | `'default'` | Style variant for dots |
| `className` | `string` | `''` | Additional CSS classes for button container |

## Button Positions

### `bottom-right` (default)
Buttons positioned at the bottom-right corner of the slider container. Good for content-focused sliders.

```tsx
<SliderNavigation buttonPosition="bottom-right" />
```

### `bottom-center`
Buttons positioned at the bottom-center of the slider container.

```tsx
<SliderNavigation buttonPosition="bottom-center" />
```

### `sides`
Buttons positioned on the left and right sides, vertically centered. Perfect for image galleries and full-width sliders.

```tsx
<SliderNavigation buttonPosition="sides" />
```

### `top-right`
Buttons positioned at the top-right corner of the slider container.

```tsx
<SliderNavigation buttonPosition="top-right" />
```

## Button Variants

### `default` / `minimal`
Minimal gray chevron icons with hover effects and subtle animations.
- Used in: BlogPostSlider

```tsx
<SliderNavigation buttonVariant="minimal" />
```

### `circle`
Circular white buttons with shadows and scale animations on hover.
- Used in: TemplateSection slider mode

```tsx
<SliderNavigation buttonVariant="circle" />
```

## Dot Variants

### `default`
Standard dots (3x3px) that expand to 8x3px when active.

```tsx
<SliderNavigation dotVariant="default" />
```

### `large`
Larger dots (2.5x2.5px) that expand to 8x2.5px when active. Better visibility for large sliders.

```tsx
<SliderNavigation dotVariant="large" />
```

## Implementation Examples

### BlogPostSlider (Content Slider)
```tsx
<SliderNavigation
  onPrevious={handlePrevious}
  onNext={handleNext}
  currentIndex={currentIndex}
  totalItems={posts.length}
  onDotClick={handleDotClick}
  showDots={true}
  buttonPosition="bottom-right"
  buttonVariant="minimal"
  dotVariant="default"
/>
```

### TemplateSection (Carousel with Cards)
```tsx
<SliderNavigation
  onPrevious={prevSlide}
  onNext={nextSlide}
  currentIndex={currentSlide}
  totalItems={totalDots}
  onDotClick={goToSlide}
  showDots={true}
  buttonPosition="sides"
  buttonVariant="circle"
  dotVariant="large"
/>
```

## Styling Notes

- Navigation buttons are hidden on mobile (`hidden md:flex`)
- Dots are always visible on all screen sizes
- Buttons have smooth transitions and hover effects
- Component returns `null` when `totalItems <= 1`

## Accessibility

- All buttons have proper `aria-label` attributes
- Keyboard navigation supported
- Focus states properly styled
- Screen reader friendly

## Dependencies

- `@heroicons/react` - For chevron icons
- `react` - React 18+
