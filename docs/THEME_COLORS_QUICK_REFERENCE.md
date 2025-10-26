# Theme Colors Quick Reference

## Quick Start

### 1. Use in Any Component

```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MyComponent() {
  const colors = useThemeColors();
  
  return (
    <div className={`bg-${colors.primary.bgLight} p-6 rounded-lg`}>
      <h2 className={`text-${colors.primary.text} font-bold`}>
        Hello World
      </h2>
      <button className={`bg-${colors.primary.bg} hover:bg-${colors.primary.bgHover} text-white px-4 py-2 rounded`}>
        Click Me
      </button>
    </div>
  );
}
```

### 2. Available Properties

```typescript
const colors = useThemeColors();

// PRIMARY COLORS
colors.primary.bg           // Base background (e.g., 'sky-600')
colors.primary.bgHover      // Hover background (base + 100)
colors.primary.bgActive     // Active background (base + 200)
colors.primary.bgLight      // Light background (base - 450)
colors.primary.bgLighter    // Lightest background (base - 500)
colors.primary.bgDisabled   // Disabled background (base - 300)
colors.primary.text         // Text color (same as base)
colors.primary.textHover    // Hover text color
colors.primary.textLight    // Light text color
colors.primary.border       // Border color (base - 200)
colors.primary.borderHover  // Hover border color
colors.primary.ring         // Focus ring color

// SECONDARY COLORS (same structure)
colors.secondary.bg
colors.secondary.bgHover
// ... etc

// CSS VARIABLES (for inline styles)
colors.cssVars.primary.base      // 'var(--color-primary-base)'
colors.cssVars.primary.hover     // 'var(--color-primary-hover)'
// ... etc

// RAW VALUES
colors.raw.primary.color         // 'sky'
colors.raw.primary.shade         // 600
colors.raw.primary.variants      // { base: 600, hover: 700, ... }
```

## Common Patterns

### Button Variants

```typescript
const colors = useThemeColors();

// Primary button
<button className={`bg-${colors.primary.bg} hover:bg-${colors.primary.bgHover} text-white`}>
  Primary
</button>

// Secondary button
<button className={`bg-${colors.secondary.bg} hover:bg-${colors.secondary.bgHover} text-white`}>
  Secondary
</button>

// Outline button
<button className={`border-2 border-${colors.primary.border} hover:border-${colors.primary.bg} text-${colors.primary.text}`}>
  Outline
</button>

// Ghost button
<button className={`text-${colors.primary.text} hover:bg-${colors.primary.bgLight}`}>
  Ghost
</button>
```

### Card Backgrounds

```typescript
// Light card with primary accent
<div className={`bg-${colors.primary.bgLighter} border border-${colors.primary.border} p-6 rounded-lg`}>
  <h3 className={`text-${colors.primary.text} font-bold mb-2`}>Card Title</h3>
  <p className="text-gray-600">Card content here</p>
</div>

// Primary card
<div className={`bg-${colors.primary.bg} text-white p-6 rounded-lg shadow-lg`}>
  <h3 className="font-bold mb-2">Featured Card</h3>
  <p className="opacity-90">Important information</p>
</div>
```

### Links

```typescript
<a href="#" className={`text-${colors.primary.text} hover:text-${colors.primary.textHover} underline`}>
  Click here
</a>
```

### Badges

```typescript
// Primary badge
<span className={`bg-${colors.primary.bgLight} text-${colors.primary.text} px-3 py-1 rounded-full text-sm font-medium`}>
  New
</span>

// Secondary badge
<span className={`bg-${colors.secondary.bgLight} text-${colors.secondary.text} px-3 py-1 rounded-full text-sm font-medium`}>
  Beta
</span>
```

### Form Inputs

```typescript
<input 
  className={`
    border-${colors.primary.border}
    focus:border-${colors.primary.bg}
    focus:ring-2
    focus:ring-${colors.primary.bg}
    focus:ring-opacity-20
    rounded-lg px-4 py-2
  `}
/>
```

### Loading States

```typescript
<button 
  disabled 
  className={`bg-${colors.primary.bgDisabled} text-white cursor-not-allowed`}
>
  <Spinner className="mr-2" />
  Loading...
</button>
```

## Inline Styles (CSS Variables)

When you need computed styles or dynamic opacity:

```typescript
const colors = useThemeColors();

<div 
  style={{
    backgroundColor: colors.cssVars.primary.base,
    borderColor: colors.cssVars.primary.border,
    color: 'white',
  }}
>
  Dynamic content
</div>

// With opacity
<div 
  style={{
    backgroundColor: colors.cssVars.primary.base,
    opacity: 0.8,
  }}
>
  Semi-transparent
</div>
```

## Gradient Backgrounds

```typescript
const colors = useThemeColors();

// Linear gradient
<div className={`bg-gradient-to-r from-${colors.primary.bg} to-${colors.primary.bgHover}`}>
  Gradient background
</div>

// With secondary color
<div className={`bg-gradient-to-br from-${colors.primary.bg} via-${colors.primary.bgHover} to-${colors.secondary.bg}`}>
  Multi-color gradient
</div>
```

## Hover & Focus States

```typescript
const colors = useThemeColors();

<div className={`
  bg-${colors.primary.bgLight}
  hover:bg-${colors.primary.bg}
  hover:text-white
  focus:ring-2
  focus:ring-${colors.primary.bg}
  focus:ring-offset-2
  transition-all duration-200
  cursor-pointer
  p-4 rounded-lg
`}>
  Interactive element
</div>
```

## Conditional Styling

```typescript
const colors = useThemeColors();
const isActive = true;

<button className={`
  ${isActive 
    ? `bg-${colors.primary.bg} text-white` 
    : `bg-gray-100 text-gray-600`
  }
  hover:bg-${colors.primary.bgHover}
  px-4 py-2 rounded
`}>
  Toggle Button
</button>
```

## Dark Text on Light Background

```typescript
const colors = useThemeColors();

<div className={`bg-${colors.primary.bgLighter} text-${colors.primary.text} p-6`}>
  <h2 className="font-bold">Section Title</h2>
  <p className={`text-${colors.primary.textLight}`}>
    Description text
  </p>
</div>
```

## Alerts & Notifications

```typescript
const colors = useThemeColors();

// Info alert
<div className={`bg-${colors.primary.bgLight} border-l-4 border-${colors.primary.bg} p-4`}>
  <p className={`text-${colors.primary.text} font-medium`}>Information</p>
</div>

// Success alert (using secondary as success)
<div className={`bg-green-50 border-l-4 border-green-500 p-4`}>
  <p className="text-green-700 font-medium">Success!</p>
</div>
```

## Tabs

```typescript
const colors = useThemeColors();
const [activeTab, setActiveTab] = useState(0);

<div className="flex border-b">
  {tabs.map((tab, index) => (
    <button
      key={index}
      onClick={() => setActiveTab(index)}
      className={`
        px-4 py-2 font-medium transition-colors
        ${activeTab === index
          ? `text-${colors.primary.text} border-b-2 border-${colors.primary.bg}`
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
    >
      {tab.label}
    </button>
  ))}
</div>
```

## Progress Bars

```typescript
const colors = useThemeColors();

<div className={`bg-${colors.primary.bgLighter} rounded-full h-2 overflow-hidden`}>
  <div 
    className={`bg-${colors.primary.bg} h-full transition-all duration-300`}
    style={{ width: '60%' }}
  />
</div>
```

## Tables

```typescript
const colors = useThemeColors();

<table className="w-full">
  <thead className={`bg-${colors.primary.bgLight}`}>
    <tr>
      <th className={`text-${colors.primary.text} text-left p-3`}>Name</th>
      <th className={`text-${colors.primary.text} text-left p-3`}>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3">Item 1</td>
      <td className="p-3">Value 1</td>
    </tr>
  </tbody>
</table>
```

## Testing Your Component

```typescript
// In your component
const colors = useThemeColors();

useEffect(() => {
  console.log('Current theme colors:', colors.raw);
}, [colors]);
```

## Default Values

If settings are not loaded yet, these defaults are used:
- Primary: `sky-600`
- Secondary: `gray-500`

## TypeScript Support

The hook is fully typed:

```typescript
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors(); // Fully typed return value
```

## Best Practices

1. **Use safelist classes when possible** (better performance)
2. **Use CSS variables for computed/dynamic styles**
3. **Keep color usage consistent** (primary for actions, secondary for content)
4. **Test in light and dark backgrounds**
5. **Consider contrast ratios** for accessibility
6. **Don't override theme colors** unless absolutely necessary

## Need Help?

- See full documentation: `/docs/THEME_COLOR_SYSTEM_IMPLEMENTATION.md`
- Check examples: `/src/ui/Button.tsx`
- View theme utilities: `/src/utils/themeUtils.ts`
