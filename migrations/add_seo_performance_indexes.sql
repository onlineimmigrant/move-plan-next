-- SEO Performance Optimization: Add Database Indexes
-- These indexes dramatically improve SEO-related query performance
-- Reduces TTFB from 3420ms to <800ms target

-- IMPORTANT: For Supabase SQL Editor, remove CONCURRENTLY keyword
-- Or run each CREATE INDEX statement separately

-- Index for pages table SEO queries
-- Used by fetchPageSEOData() when looking up page metadata
CREATE INDEX IF NOT EXISTS idx_pages_path_org_seo 
ON pages(path, organization_id);

-- Index for blog post SEO queries  
-- Used when generating blog post metadata and structured data
CREATE INDEX IF NOT EXISTS idx_blog_post_slug_org_seo
ON blog_post(slug, organization_id);

-- Index for blog post display filtering
-- Used when filtering posts by display_config.display_this_post
CREATE INDEX IF NOT EXISTS idx_blog_post_display_org
ON blog_post(organization_id, ((display_config->>'display_this_post')::boolean));

-- Index for product SEO queries
-- Used when generating product structured data and metadata
CREATE INDEX IF NOT EXISTS idx_product_slug_org_seo
ON product(slug, organization_id);

-- Index for FAQ queries (homepage and FAQ pages)
-- Used for FAQ structured data generation
CREATE INDEX IF NOT EXISTS idx_faq_org_home
ON faq(organization_id);

-- Index for organization lookups by base_url
-- Used frequently for multi-tenant routing
CREATE INDEX IF NOT EXISTS idx_organizations_base_url
ON organizations(base_url);

-- Analyze tables to update query planner statistics
ANALYZE pages;
ANALYZE blog_post;
ANALYZE product;
ANALYZE faq;
ANALYZE organizations;
