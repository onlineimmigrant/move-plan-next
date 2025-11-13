import React, { useState, useEffect } from 'react';
import { Organization } from './types';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  NewspaperIcon, 
  SparklesIcon, 
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface SiteMapTreeProps {
  organization: Organization;
  session: any;
  onPageSelect?: (url: string) => void;
  compact?: boolean; // For modal view
  searchQuery?: string; // Search filter
  filters?: {
    type: string[];
    priority: string[];
    changefreq: string[];
  };
}

interface SitemapPage {
  url: string;
  lastmod: string;
  priority: number;
  changefreq?: string;
}

interface PageNode {
  name: string;
  path: string;
  url: string;
  priority: number;
  lastmod: string;
  children?: PageNode[];
  type: 'home' | 'static' | 'blog' | 'feature' | 'product';
  level: 1 | 2 | 3;
  category?: string;
}

export default function SiteMapTree({ 
  organization, 
  session, 
  onPageSelect, 
  compact = false,
  searchQuery = '',
  filters = { type: [], priority: [], changefreq: [] }
}: SiteMapTreeProps) {
  const [sitemapData, setSitemapData] = useState<PageNode[]>([]);
  const [filteredData, setFilteredData] = useState<PageNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['/']));
  const [stats, setStats] = useState<Record<string, number>>({ total: 0 });
  const [orgData, setOrgData] = useState<any>(null);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(false);

  const SECOND_LEVEL_PAGES = ['/about-us', '/products', '/features', '/blog', '/faq', '/terms', '/support'];

  useEffect(() => {
    fetchSitemapData();
    fetchOrganizationData();
  }, [organization]);

  // Filter data based on search and filters
  useEffect(() => {
    if (!sitemapData || sitemapData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...sitemapData];

    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filterNodesBySearch(filtered, query);
      
      // Auto-expand all nodes when searching
      const allPaths = getAllNodePaths(filtered);
      setExpandedNodes(new Set(allPaths));
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filterNodesByType(filtered, filters.type);
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filterNodesByPriority(filtered, filters.priority);
    }

    // Apply changefreq filter
    if (filters.changefreq && filters.changefreq.length > 0) {
      filtered = filterNodesByChangefreq(filtered, filters.changefreq);
    }

    setFilteredData(filtered);
  }, [sitemapData, searchQuery, filters]);

  // Helper: Filter nodes by search query
  const filterNodesBySearch = (nodes: PageNode[], query: string): PageNode[] => {
    return nodes.reduce((acc: PageNode[], node) => {
      const matches = node.name.toLowerCase().includes(query) || 
                     node.path.toLowerCase().includes(query) ||
                     node.url.toLowerCase().includes(query);
      
      const filteredChildren = node.children ? filterNodesBySearch(node.children, query) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
      }
      
      return acc;
    }, []);
  };

  // Helper: Filter nodes by type
  const filterNodesByType = (nodes: PageNode[], types: string[]): PageNode[] => {
    return nodes.reduce((acc: PageNode[], node) => {
      const matches = types.includes(node.type);
      const filteredChildren = node.children ? filterNodesByType(node.children, types) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
      }
      
      return acc;
    }, []);
  };

  // Helper: Filter nodes by priority
  const filterNodesByPriority = (nodes: PageNode[], priorities: string[]): PageNode[] => {
    return nodes.reduce((acc: PageNode[], node) => {
      const matches = priorities.includes(node.priority.toString());
      const filteredChildren = node.children ? filterNodesByPriority(node.children, priorities) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
      }
      
      return acc;
    }, []);
  };

  // Helper: Filter nodes by changefreq (would need to add changefreq to PageNode)
  const filterNodesByChangefreq = (nodes: PageNode[], changefreqs: string[]): PageNode[] => {
    return nodes.reduce((acc: PageNode[], node) => {
      // For now, just pass through since changefreq isn't in PageNode interface
      const filteredChildren = node.children ? filterNodesByChangefreq(node.children, changefreqs) : [];
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      });
      return acc;
    }, []);
  };

  // Helper: Get all node paths for auto-expansion
  const getAllNodePaths = (nodes: PageNode[]): string[] => {
    const paths: string[] = [];
    
    const traverse = (node: PageNode) => {
      paths.push(node.path);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    nodes.forEach(traverse);
    return paths;
  };

  const fetchSitemapData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = organization.base_url || organization.base_url_local || window.location.origin;
      
      console.log('[SiteMapTree] Fetching sitemap for organization:', {
        organizationId: organization.id,
        organizationName: organization.name,
        baseUrl
      });

      const proxyUrl = `/api/sitemap-proxy?organizationId=${encodeURIComponent(organization.id)}&baseUrl=${encodeURIComponent(baseUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || response.statusText;
        
        console.error('[SiteMapTree] Failed to fetch sitemap:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          sitemapUrl: `${baseUrl}/sitemap.xml`
        });
        
        if (response.status === 403) {
          throw new Error(`Sitemap access forbidden. Please ensure ${baseUrl}/sitemap.xml is publicly accessible.`);
        } else if (response.status === 404) {
          throw new Error(`Sitemap not found at ${baseUrl}/sitemap.xml. Please generate a sitemap first.`);
        } else {
          throw new Error(`Failed to fetch sitemap: ${errorMessage}`);
        }
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse sitemap XML');
      }

      const urlElements = xmlDoc.querySelectorAll('url');
      const pages: SitemapPage[] = Array.from(urlElements).map(urlEl => {
        const loc = urlEl.querySelector('loc')?.textContent || '';
        const lastmod = urlEl.querySelector('lastmod')?.textContent || new Date().toISOString();
        const priority = parseFloat(urlEl.querySelector('priority')?.textContent || '0.5');
        const changefreq = urlEl.querySelector('changefreq')?.textContent || 'weekly';

        return { url: loc, lastmod, priority, changefreq };
      });

      const tree = buildPageTree(pages, baseUrl);
      setSitemapData(tree);
      setStats({ total: pages.length });

    } catch (err) {
      console.error('Error fetching sitemap:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sitemap';
      setError(errorMessage);
      
      // Try to generate sitemap from organization pages as fallback
      console.log('[SiteMapTree] Attempting to generate sitemap from organization pages...');
      await generateSitemapFromPages();
    } finally {
      setIsLoading(false);
    }
  };

  const generateSitemapFromPages = async () => {
    try {
      const token = session?.access_token;
      if (!token) {
        console.warn('[SiteMapTree] No session token available for fallback');
        return;
      }

      const response = await fetch(`/api/organizations/${organization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization pages');
      }

      const data = await response.json();
      const baseUrl = organization.base_url || organization.base_url_local || window.location.origin;
      
      // Generate pages from organization data
      const pages: SitemapPage[] = [];
      
      // Add home page
      pages.push({
        url: baseUrl,
        lastmod: new Date().toISOString(),
        priority: 1.0,
        changefreq: 'daily'
      });

      // Add pages from organization
      if (data.pages && Array.isArray(data.pages)) {
        data.pages.forEach((page: any) => {
          if (page.slug && page.active !== false) {
            pages.push({
              url: `${baseUrl}/${page.slug}`,
              lastmod: page.updated_at || page.created_at || new Date().toISOString(),
              priority: page.priority || 0.8,
              changefreq: page.changefreq || 'weekly'
            });
          }
        });
      }

      // Add blog posts
      if (data.blog_posts && Array.isArray(data.blog_posts)) {
        data.blog_posts.forEach((post: any) => {
          if (post.slug && post.published) {
            pages.push({
              url: `${baseUrl}/blog/${post.slug}`,
              lastmod: post.updated_at || post.created_at || new Date().toISOString(),
              priority: 0.7,
              changefreq: 'monthly'
            });
          }
        });
      }

      if (pages.length > 0) {
        const tree = buildPageTree(pages, baseUrl);
        setSitemapData(tree);
        setStats({ total: pages.length });
        setError(null); // Clear error if fallback succeeds
        console.log('[SiteMapTree] Successfully generated sitemap from pages:', pages.length);
      }
    } catch (fallbackErr) {
      console.error('[SiteMapTree] Fallback sitemap generation failed:', fallbackErr);
      // Keep the original error message
    }
  };

  const fetchOrganizationData = async () => {
    try {
      setIsLoadingOrgData(true);
      
      const token = session?.access_token;
      if (!token) {
        console.warn('[SiteMapTree] No session token available');
        return;
      }

      console.log('[SiteMapTree] Fetching organization data with menu items and products');
      
      const response = await fetch(`/api/organizations/${organization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organization data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[SiteMapTree] Fetched organization data:', {
        menuItems: data.menu_items?.length || 0,
        products: data.products?.length || 0,
        pricingPlans: data.pricing_plans?.length || 0
      });
      
      setOrgData(data);

    } catch (err) {
      console.error('Error fetching organization data:', err);
      // Don't set error state, just log - sitemap can still work without this data
    } finally {
      setIsLoadingOrgData(false);
    }
  };

  const categorizePageType = (url: string, baseUrl: string): { type: 'home' | 'static' | 'blog' | 'feature' | 'product', level: 1 | 2 | 3 } => {
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      path = url.replace(baseUrl, '');
    }
    
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    if (path === '/' || path === '') {
      return { type: 'home', level: 1 };
    }
    
    if (SECOND_LEVEL_PAGES.includes(path)) {
      return { type: 'static', level: 2 };
    }
    
    if (path.startsWith('/blog/')) {
      return { type: 'blog', level: 3 };
    }
    
    if (path.startsWith('/features/')) {
      return { type: 'feature', level: 3 };
    }
    
    if (path.startsWith('/products/')) {
      return { type: 'product', level: 3 };
    }
    
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 1 && !SECOND_LEVEL_PAGES.includes(path)) {
      return { type: 'blog', level: 3 };
    }
    
    return { type: 'static', level: 2 };
  };

  const buildPageTree = (pages: SitemapPage[], baseUrl: string): PageNode[] => {
    const categorizedPages = pages.map(page => {
      let path = page.url;
      try {
        const urlObj = new URL(page.url);
        path = urlObj.pathname;
      } catch {
        path = page.url.replace(baseUrl, '');
      }
      
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      if (path !== '/' && path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      const { type, level } = categorizePageType(page.url, baseUrl);
      
      let category: string | undefined = undefined;
      const segments = path.split('/').filter(Boolean);
      
      if (segments.length > 0) {
        category = segments[0];
      }

      const name = path === '/' 
        ? 'Home' 
        : segments[segments.length - 1]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

      return {
        name,
        path,
        url: page.url,
        priority: page.priority,
        lastmod: page.lastmod,
        type,
        level,
        category,
        children: []
      };
    });

    const pathMap = new Map<string, PageNode>();
    categorizedPages.forEach(page => {
      pathMap.set(page.path, page);
    });

    const findOrCreateParent = (childPath: string, childType: string): string | null => {
      const segments = childPath.split('/').filter(Boolean);
      
      if (segments.length === 0) return null;
      if (segments.length === 1) return '/';
      
      const parentSegments = segments.slice(0, -1);
      const parentPath = '/' + parentSegments.join('/');
      
      if (pathMap.has(parentPath)) {
        return parentPath;
      }
      
      const parentName = segments[segments.length - 1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const virtualParent: PageNode = {
        name: parentName,
        path: parentPath,
        url: baseUrl + parentPath,
        priority: 1.0,
        lastmod: new Date().toISOString(),
        type: 'static',
        level: segments.length === 1 ? 2 : 3,
        children: []
      };
      
      pathMap.set(parentPath, virtualParent);
      
      const grandParentPath = findOrCreateParent(parentPath, 'static');
      if (grandParentPath) {
        const grandParent = pathMap.get(grandParentPath);
        if (grandParent) {
          if (!grandParent.children) grandParent.children = [];
          if (!grandParent.children.some(c => c.path === parentPath)) {
            grandParent.children.push(virtualParent);
          }
        }
      }
      
      return parentPath;
    };

    const pagesWithChildren = new Set<string>();
    categorizedPages.forEach(page => {
      const segments = page.path.split('/').filter(Boolean);
      if (segments.length > 1) {
        const parentSegments = segments.slice(0, -1);
        const parentPath = '/' + parentSegments.join('/');
        pagesWithChildren.add(parentPath);
      }
    });

    categorizedPages.forEach(page => {
      const segments = page.path.split('/').filter(Boolean);
      
      if (page.path === '/') {
        return;
      }
      
      if (segments.length === 1) {
        const home = pathMap.get('/');
        if (home) {
          if (!home.children) home.children = [];
          if (!home.children.some(c => c.path === page.path)) {
            home.children.push(page);
          }
        }
        return;
      }
      
      const parentPath = findOrCreateParent(page.path, page.type);
      if (parentPath) {
        const parent = pathMap.get(parentPath);
        if (parent) {
          if (!parent.children) parent.children = [];
          if (!parent.children.some(c => c.path === page.path)) {
            parent.children.push(page);
          }
        }
      }
    });

    const home = pathMap.get('/');
    if (!home) {
      return Array.from(pathMap.values())
        .filter(p => p.path.split('/').filter(Boolean).length === 1)
        .sort((a, b) => b.priority - a.priority);
    }

    if (home.children) {
      home.children.sort((a, b) => {
        if (SECOND_LEVEL_PAGES.includes(a.path) && !SECOND_LEVEL_PAGES.includes(b.path)) return -1;
        if (!SECOND_LEVEL_PAGES.includes(a.path) && SECOND_LEVEL_PAGES.includes(b.path)) return 1;
        return b.priority - a.priority;
      });
      
      home.children.forEach(child => {
        if (child.children) {
          child.children.sort((a, b) => b.priority - a.priority);
        }
      });
    }

    return [home];
  };

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'home':
        return <HomeIcon className="w-4 h-4" />;
      case 'static':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'blog':
        return <NewspaperIcon className="w-4 h-4" />;
      case 'feature':
        return <SparklesIcon className="w-4 h-4" />;
      case 'product':
        return <ShoppingBagIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 1.0) return 'text-green-600 bg-green-50 border-green-200';
    if (priority >= 0.8) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (priority >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const handlePageClick = (url: string, name: string) => {
    if (onPageSelect) {
      onPageSelect(url);
    }
  };

  const renderNode = (node: PageNode, nestingLevel: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    const paddingLeft = nestingLevel * 16;
    const paddingLeftDesktop = nestingLevel * 24;
    
    const fontClass = nestingLevel === 0 ? 'font-bold text-base sm:text-lg' : nestingLevel === 1 ? 'font-semibold text-sm sm:text-base' : 'font-normal text-sm';

    return (
      <div key={node.path} className="space-y-1">
        <div 
          className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          style={{ 
            paddingLeft: `${paddingLeft}px`,
          }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.path)}
              className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <span className="text-gray-600 font-bold text-xs sm:text-sm">−</span>
              ) : (
                <span className="text-gray-600 font-bold text-xs sm:text-sm">+</span>
              )}
            </button>
          ) : (
            <div className="w-5 sm:w-6" />
          )}

          <div className="flex-shrink-0 text-gray-500">
            <div className="w-4 h-4 sm:w-5 sm:h-5">
              {getIconForType(node.type)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => handlePageClick(node.url, node.name)}
                className={`text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors text-left ${fontClass}`}
                title="Click to preview page"
              >
                {node.name}
              </button>
              {hasChildren && (
                <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                  {node.children!.length}
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 truncate" title={node.path}>
              {node.path}
            </div>
          </div>

          {!compact && (
            <>
              <span className={`hidden sm:flex flex-shrink-0 px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(node.priority)}`}>
                <SignalIcon className="w-3 h-3 inline mr-1" />
                {node.priority.toFixed(1)}
              </span>

              <span className="hidden md:flex flex-shrink-0 text-xs text-gray-500 items-center gap-1 min-w-[100px]">
                <ClockIcon className="w-3 h-3" />
                {formatDate(node.lastmod)}
              </span>
            </>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderNode(child, nestingLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading sitemap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-red-600 text-4xl sm:text-5xl mb-3 sm:mb-4">⚠️</div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Failed to Load Sitemap</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-4">{error}</p>
        <button
          onClick={fetchSitemapData}
          className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h3 className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-semibold text-gray-900`}>
              Site Structure
            </h3>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
              {stats.total} pages
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Visual representation of your site's page hierarchy
          </p>
        </div>
      </div>

      {/* Tree */}
      <div className={`${compact ? 'max-h-[400px]' : 'max-h-[500px] sm:max-h-[600px]'} overflow-y-auto`}>
        {(filteredData.length > 0 ? filteredData : sitemapData).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || filters.type.length > 0 || filters.priority.length > 0 || filters.changefreq.length > 0
              ? 'No pages match your search or filters'
              : 'No pages found in sitemap'}
          </div>
        ) : (
          <div className="space-y-1">
            {(filteredData.length > 0 ? filteredData : sitemapData).map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Structured Data Section - Menu Items & Products */}
      {!compact && orgData && (
        <div className="mt-8 pt-8 border-t-2 border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Structure</h3>
          <p className="text-sm text-gray-600 mb-6">
            Navigation menus and products with their nested items
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Items with Submenus */}
            {orgData.menu_items && orgData.menu_items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Menu Items
                  </h4>
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {orgData.menu_items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {orgData.menu_items.map((menuItem: any) => (
                    <div key={menuItem.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{menuItem.item_name}</span>
                        {menuItem.submenu_items && menuItem.submenu_items.length > 0 && (
                          <span className="ml-auto px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            {menuItem.submenu_items.length} submenu{menuItem.submenu_items.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Submenus */}
                      {menuItem.submenu_items && menuItem.submenu_items.length > 0 && (
                        <div className="mt-2 ml-6 space-y-1">
                          {menuItem.submenu_items.map((submenu: any) => (
                            <div key={submenu.id} className="flex items-center gap-2 text-sm text-gray-600">
                              <ChevronRightIcon className="w-3 h-3 text-gray-300" />
                              <span>{submenu.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products with Pricing Plans */}
            {orgData.products && orgData.products.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBagIcon className="w-5 h-5 text-purple-600" />
                  <h4 className="text-base font-semibold text-gray-900">
                    Products
                  </h4>
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {orgData.products.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {orgData.products.map((product: any) => (
                    <div key={product.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{product.product_name}</span>
                        {product.pricing_plans && product.pricing_plans.length > 0 && (
                          <span className="ml-auto px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            {product.pricing_plans.length} plan{product.pricing_plans.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Pricing Plans */}
                      {product.pricing_plans && product.pricing_plans.length > 0 && (
                        <div className="mt-2 ml-6 space-y-1">
                          {product.pricing_plans.map((plan: any) => (
                            <div key={plan.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <ChevronRightIcon className="w-3 h-3 text-gray-300" />
                                <span>
                                  {plan.package}
                                  {plan.measure && ` (${plan.measure})`}
                                </span>
                              </div>
                              <span className="text-xs text-purple-600 font-medium">
                                {plan.currency_symbol || plan.currency}{((plan.price || 0) / 100).toFixed(2)}
                                {plan.recurring_interval && `/${plan.recurring_interval}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Empty State */}
          {(!orgData.menu_items || orgData.menu_items.length === 0) && 
           (!orgData.products || orgData.products.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No menu items or products found</p>
              <p className="text-sm mt-1">Create menu items and products to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Legend (only if not compact) */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Home (Level 1)</span>
              </div>
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Static Page (Level 2)</span>
              </div>
              <div className="flex items-center gap-2">
                <NewspaperIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Blog Post (Level 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Feature (Level 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBagIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Product (Level 3)</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="text-xs text-gray-600">
                <strong>Hierarchy:</strong>
              </div>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Level 1:</strong> Home page (/) - root of the site</li>
                <li><strong>Level 2:</strong> Main sections (/about-us, /products, /features, /blog, etc.)</li>
                <li><strong>Level 3:</strong> Content pages (blog posts, features, products) - click "+" to expand</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                <strong>Priority Levels:</strong> Higher priority (1.0) = more important pages for search engines
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
