# Component Migration Guide - Theme Colors

This guide helps developers convert existing components from hardcoded colors to the dynamic theme system.

## Before You Start

1. **Add 'use client' directive** if not already present (hook requires client component)
2. **Import the hook**: `import { useThemeColors } from '@/hooks/useThemeColors';`
3. **Call the hook**: `const colors = useThemeColors();`
4. **Replace hardcoded colors** with theme color properties

---

## Migration Examples

### Example 1: Simple Button

**BEFORE:**
```typescript
export default function MyButton() {
  return (
    <button className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded">
      Click Me
    </button>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MyButton() {
  const colors = useThemeColors();
  
  return (
    <button className={`bg-${colors.primary.bg} hover:bg-${colors.primary.bgHover} text-white px-4 py-2 rounded`}>
      Click Me
    </button>
  );
}
```

---

### Example 2: Card Component

**BEFORE:**
```typescript
export default function Card({ children }) {
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-6">
      <h3 className="text-sky-700 font-bold mb-2">Card Title</h3>
      {children}
    </div>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Card({ children }) {
  const colors = useThemeColors();
  
  return (
    <div className={`bg-${colors.primary.bgLighter} border border-${colors.primary.border} rounded-lg p-6`}>
      <h3 className={`text-${colors.primary.textHover} font-bold mb-2`}>Card Title</h3>
      {children}
    </div>
  );
}
```

---

### Example 3: Link Component

**BEFORE:**
```typescript
export default function NavLink({ href, children }) {
  return (
    <a 
      href={href}
      className="text-sky-600 hover:text-sky-700 hover:underline"
    >
      {children}
    </a>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function NavLink({ href, children }) {
  const colors = useThemeColors();
  
  return (
    <a 
      href={href}
      className={`text-${colors.primary.text} hover:text-${colors.primary.textHover} hover:underline`}
    >
      {children}
    </a>
  );
}
```

---

### Example 4: Badge Component

**BEFORE:**
```typescript
export default function Badge({ label, variant = 'primary' }) {
  const variants = {
    primary: 'bg-sky-100 text-sky-700 border-sky-200',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  
  return (
    <span className={`${variants[variant]} px-3 py-1 rounded-full text-sm border`}>
      {label}
    </span>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Badge({ label, variant = 'primary' }) {
  const colors = useThemeColors();
  
  const variants = {
    primary: `bg-${colors.primary.bgLight} text-${colors.primary.text} border-${colors.primary.border}`,
    secondary: `bg-${colors.secondary.bgLight} text-${colors.secondary.text} border-${colors.secondary.border}`,
  };
  
  return (
    <span className={`${variants[variant]} px-3 py-1 rounded-full text-sm border`}>
      {label}
    </span>
  );
}
```

---

### Example 5: Input with Focus States

**BEFORE:**
```typescript
export default function Input(props) {
  return (
    <input
      {...props}
      className="
        border border-gray-300
        focus:border-sky-500
        focus:ring-2
        focus:ring-sky-500
        focus:ring-opacity-20
        rounded-lg px-4 py-2
      "
    />
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Input(props) {
  const colors = useThemeColors();
  
  return (
    <input
      {...props}
      className={`
        border border-gray-300
        focus:border-${colors.primary.bg}
        focus:ring-2
        focus:ring-${colors.primary.bg}
        focus:ring-opacity-20
        rounded-lg px-4 py-2
      `}
    />
  );
}
```

---

### Example 6: Complex Component with Multiple Variants

**BEFORE:**
```typescript
export default function Alert({ type, children }) {
  const types = {
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-500',
      text: 'text-sky-700',
      icon: 'text-sky-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: 'text-green-500',
    },
  };
  
  const styles = types[type];
  
  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded`}>
      <div className="flex items-start">
        <InfoIcon className={`${styles.icon} w-5 h-5 mr-3`} />
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Alert({ type, children }) {
  const colors = useThemeColors();
  
  const types = {
    info: {
      bg: `bg-${colors.primary.bgLighter}`,
      border: `border-${colors.primary.bg}`,
      text: `text-${colors.primary.textHover}`,
      icon: `text-${colors.primary.bg}`,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: 'text-green-500',
    },
  };
  
  const styles = types[type];
  
  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded`}>
      <div className="flex items-start">
        <InfoIcon className={`${styles.icon} w-5 h-5 mr-3`} />
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  );
}
```

---

### Example 7: Gradient Background

**BEFORE:**
```typescript
export default function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-12">
      <h1 className="text-4xl font-bold">Welcome</h1>
    </div>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function HeroSection() {
  const colors = useThemeColors();
  
  return (
    <div className={`bg-gradient-to-r from-${colors.primary.bg} to-${colors.primary.bgHover} text-white p-12`}>
      <h1 className="text-4xl font-bold">Welcome</h1>
    </div>
  );
}
```

---

### Example 8: Conditional Styling

**BEFORE:**
```typescript
export default function Tab({ active, children }) {
  return (
    <button
      className={`
        px-4 py-2 font-medium transition-colors
        ${active 
          ? 'text-sky-600 border-b-2 border-sky-600' 
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
    >
      {children}
    </button>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Tab({ active, children }) {
  const colors = useThemeColors();
  
  return (
    <button
      className={`
        px-4 py-2 font-medium transition-colors
        ${active 
          ? `text-${colors.primary.text} border-b-2 border-${colors.primary.bg}` 
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
    >
      {children}
    </button>
  );
}
```

---

### Example 9: Table Headers

**BEFORE:**
```typescript
export default function Table({ headers, data }) {
  return (
    <table>
      <thead className="bg-sky-50">
        <tr>
          {headers.map(header => (
            <th className="text-sky-700 text-left p-3" key={header}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      {/* tbody */}
    </table>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Table({ headers, data }) {
  const colors = useThemeColors();
  
  return (
    <table>
      <thead className={`bg-${colors.primary.bgLight}`}>
        <tr>
          {headers.map(header => (
            <th className={`text-${colors.primary.text} text-left p-3`} key={header}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      {/* tbody */}
    </table>
  );
}
```

---

### Example 10: Using CSS Variables (Advanced)

When you need inline styles or computed values:

**BEFORE:**
```typescript
export default function ProgressBar({ percentage }) {
  return (
    <div className="bg-gray-200 rounded-full h-2">
      <div 
        className="bg-sky-600 h-full rounded-full transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

**AFTER:**
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ProgressBar({ percentage }) {
  const colors = useThemeColors();
  
  return (
    <div className="bg-gray-200 rounded-full h-2">
      <div 
        className="h-full rounded-full transition-all"
        style={{ 
          width: `${percentage}%`,
          backgroundColor: colors.cssVars.primary.base 
        }}
      />
    </div>
  );
}
```

---

## Color Mapping Reference

### Common Hardcoded Colors → Theme Properties

| Hardcoded Class | Theme Property | Use Case |
|----------------|----------------|----------|
| `bg-sky-50` | `bg-${colors.primary.bgLighter}` | Lightest background |
| `bg-sky-100` | `bg-${colors.primary.bgLight}` | Light background |
| `bg-sky-600` | `bg-${colors.primary.bg}` | Primary button |
| `bg-sky-700` | `bg-${colors.primary.bgHover}` | Button hover |
| `bg-sky-800` | `bg-${colors.primary.bgActive}` | Button active |
| `bg-sky-400` | `bg-${colors.primary.bgDisabled}` | Disabled state |
| `text-sky-600` | `text-${colors.primary.text}` | Primary text |
| `text-sky-700` | `text-${colors.primary.textHover}` | Text hover |
| `border-sky-200` | `border-${colors.primary.border}` | Border color |
| `ring-sky-500` | `ring-${colors.primary.ring}` | Focus ring |
| `bg-gray-500` | `bg-${colors.secondary.bg}` | Secondary button |
| `bg-gray-600` | `bg-${colors.secondary.bgHover}` | Secondary hover |

---

## Migration Checklist

For each component:

- [ ] Add `'use client'` directive if needed
- [ ] Import `useThemeColors` hook
- [ ] Call hook at component top: `const colors = useThemeColors();`
- [ ] Find all hardcoded `sky-` colors
- [ ] Replace with appropriate theme property
- [ ] Find all hardcoded `gray-` colors (if used for secondary)
- [ ] Replace with secondary theme property
- [ ] Test component in browser
- [ ] Verify hover/focus states work
- [ ] Check disabled states (if applicable)
- [ ] Test with different color schemes

---

## Common Pitfalls

### ❌ DON'T: Use without 'use client'
```typescript
// This will fail - hooks need client components
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MyComponent() {
  const colors = useThemeColors(); // Error!
  // ...
}
```

### ✅ DO: Add 'use client' directive
```typescript
'use client';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MyComponent() {
  const colors = useThemeColors(); // Works!
  // ...
}
```

---

### ❌ DON'T: Destructure too early
```typescript
const { bg, bgHover } = useThemeColors().primary; // Not memoized correctly
```

### ✅ DO: Store full object
```typescript
const colors = useThemeColors();
// Then use: colors.primary.bg, colors.primary.bgHover
```

---

### ❌ DON'T: Mix color sources
```typescript
// Inconsistent - mixing theme and hardcoded
<button className={`bg-${colors.primary.bg} hover:bg-sky-700`}>
```

### ✅ DO: Use theme consistently
```typescript
<button className={`bg-${colors.primary.bg} hover:bg-${colors.primary.bgHover}`}>
```

---

## Testing Your Migration

```typescript
// Add temporary console.log to verify
const colors = useThemeColors();
console.log('Theme colors:', colors.raw);

// Check in browser DevTools:
// 1. Inspect element
// 2. Check applied classes
// 3. Verify CSS variables in <html> element
```

---

## Need Help?

- **Quick Reference**: `/docs/THEME_COLORS_QUICK_REFERENCE.md`
- **Full Documentation**: `/docs/THEME_COLOR_SYSTEM_IMPLEMENTATION.md`
- **Working Example**: `/src/ui/Button.tsx`
- **Hook Source**: `/src/hooks/useThemeColors.ts`

---

## Bulk Migration Script

For finding all components that need migration:

```bash
# Find all hardcoded sky colors
grep -r "sky-[0-9]00" src/components/ --include="*.tsx" -l

# Find all hardcoded gray colors (secondary)
grep -r "gray-[456]00" src/components/ --include="*.tsx" -l

# Count occurrences
grep -r "sky-600" src/ --include="*.tsx" | wc -l
```

---

*Happy Migrating! 🎨*
