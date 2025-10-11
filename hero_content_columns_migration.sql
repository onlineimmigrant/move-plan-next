-- Add basic content columns to website_hero table
-- These columns store the actual content (title, description, etc.)

ALTER TABLE website_hero
ADD COLUMN IF NOT EXISTS h1_title TEXT,
ADD COLUMN IF NOT EXISTS p_description TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS is_seo_title BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_h1_title BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_p_description BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_button_explore BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS h1_title_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS h1_title_part_2_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS h1_title_part_3_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS p_description_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS button_explore_translation JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS seo_title_translation JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN website_hero.h1_title IS 'Main hero title text';
COMMENT ON COLUMN website_hero.p_description IS 'Hero description paragraph text';
COMMENT ON COLUMN website_hero.seo_title IS 'SEO title for the hero section';
COMMENT ON COLUMN website_hero.is_seo_title IS 'Whether to display the SEO title';
COMMENT ON COLUMN website_hero.is_h1_title IS 'Whether to display the main title';
COMMENT ON COLUMN website_hero.is_p_description IS 'Whether to display the description';
COMMENT ON COLUMN website_hero.is_button_explore IS 'Whether to display the explore button';
COMMENT ON COLUMN website_hero.organization_id IS 'Reference to the organization this hero belongs to';
COMMENT ON COLUMN website_hero.h1_title_translation IS 'Translations for the main title';
COMMENT ON COLUMN website_hero.h1_title_part_2_translation IS 'Translations for title part 2';
COMMENT ON COLUMN website_hero.h1_title_part_3_translation IS 'Translations for title part 3';
COMMENT ON COLUMN website_hero.p_description_translation IS 'Translations for the description';
COMMENT ON COLUMN website_hero.button_explore_translation IS 'Translations for the explore button';
COMMENT ON COLUMN website_hero.seo_title_translation IS 'Translations for the SEO title';