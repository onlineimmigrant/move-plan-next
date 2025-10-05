# Featured Features Setup Guide

## Overview
Featured Features are special features displayed prominently in the Help Center welcome page. They require:
1. `is_help_center = true` flag in the database
2. Optional `icon` field for custom HeroIcons

## Step 1: Run the Database Migration

Execute this SQL in your Supabase SQL Editor or via psql:

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f database/migrations/add_is_help_center_and_icon_to_feature.sql
```

Or copy/paste the SQL directly in Supabase Dashboard > SQL Editor

## Step 2: Mark Features as Featured

Update your features to be displayed in the help center:

```sql
-- Example: Mark specific features as featured with custom icons
UPDATE feature 
SET 
  is_help_center = true,
  icon = 'RocketLaunchIcon'
WHERE slug = 'your-awesome-feature';

UPDATE feature 
SET 
  is_help_center = true,
  icon = 'SparklesIcon'
WHERE slug = 'another-great-feature';
```

## Available HeroIcons

Common icons you can use (from @heroicons/react/24/outline):
- `RocketLaunchIcon` - For launch/performance features
- `SparklesIcon` - For new/special features
- `BoltIcon` - For speed/power features
- `ShieldCheckIcon` - For security features
- `ChartBarIcon` - For analytics features
- `CpuChipIcon` - For technical features
- `LightBulbIcon` - For innovative features
- `StarIcon` - For premium features
- `FireIcon` - For hot/trending features
- `AcademicCapIcon` - For educational features

See full list at: https://heroicons.com/

## Step 3: Verify Featured Features

```sql
-- Check which features are featured
SELECT 
  id,
  name,
  slug,
  icon,
  is_help_center,
  description
FROM feature 
WHERE is_help_center = true
ORDER BY created_at DESC;
```

## How It Works

### Frontend Display
- **Location**: Help Center Welcome Page
- **Section**: "Featured Features" (purple/pink gradient cards)
- **Limit**: Shows top 5 featured features
- **Styling**: Glass morphism cards with hover effects
- **Icons**: Renders custom HeroIcon or default MdOutlineFeaturedPlayList

### API Filtering
- Endpoint: `/api/features?organization_id=XXX&help_center=true`
- Filter: `WHERE is_help_center = true`
- Returns: Only features marked for help center display

### Icon Rendering Logic
```typescript
// If icon field exists and is valid HeroIcon name
feature.icon = 'RocketLaunchIcon' → Renders RocketLaunchIcon component

// If icon field is empty or invalid
→ Renders default MdOutlineFeaturedPlayList icon
```

## Translations

Featured Features section supports 11 languages:
- English: Featured Features / Discover what makes us special
- Spanish: Características Destacadas / Descubre lo que nos hace especiales
- French: Fonctionnalités en Vedette / Découvrez ce qui nous rend spéciaux
- German: Vorgestellte Funktionen / Entdecken Sie, was uns besonders macht
- Russian: Избранные Функции / Откройте для себя то, что делает нас особенными
- Portuguese: Recursos em Destaque / Descubra o que nos torna especiais
- Italian: Funzionalità in Evidenza / Scopri cosa ci rende speciali
- Dutch: Uitgelichte Functies / Ontdek wat ons bijzonder maakt
- Polish: Wyróżnione Funkcje / Odkryj, co nas wyróżnia
- Japanese: 注目の機能 / 私たちの特別な点をご覧ください
- Chinese: 精选功能 / 发现我们的特色

## Testing

1. Run the migration
2. Mark 5+ features as featured
3. Visit `/help-center` in your browser
4. Verify featured features appear with correct icons
5. Test in different languages using locale switcher

## Troubleshooting

**No features showing?**
- Check `is_help_center = true` is set in database
- Verify organization_id matches in database
- Check browser console for API errors

**Icons not displaying?**
- Verify icon name exactly matches HeroIcon export name
- Check icon field is spelled correctly (case-sensitive)
- Ensure @heroicons/react is installed

**Wrong features showing?**
- Clear browser cache
- Check only 5 features have `is_help_center = true`
- Verify API endpoint is being called with `help_center=true`
