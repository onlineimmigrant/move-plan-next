'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon, LightBulbIcon, ArrowRightIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import DOMPurify from 'dompurify';

interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  subsection: string;
  author_name: string;
  created_on: string;
  main_photo?: string;
  is_help_center?: boolean;
  help_center_order?: number;
}

interface KnowledgeBaseWidgetProps {
  searchQuery?: string; // Pass ticket subject/description for smart suggestions
  onArticleHelpful?: (articleId: number, helpful: boolean) => void;
  onArticleSolved?: (articleId: number) => void; // Called if article solved customer's issue
  compact?: boolean; // Compact mode for inline display
  maxSuggestions?: number;
}

export default function KnowledgeBaseWidget({
  searchQuery = '',
  onArticleHelpful,
  onArticleSolved,
  compact = false,
  maxSuggestions = 3
}: KnowledgeBaseWidgetProps) {
  const { settings } = useSettings();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [votedArticles, setVotedArticles] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchArticles();
  }, [settings?.organization_id]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_post')
        .select('*')
        .eq('organization_id', settings?.organization_id)
        .eq('is_help_center', true)
        .eq('display_this_post', true)
        .order('help_center_order', { ascending: true });

      if (error) {
        console.error('Error fetching articles:', error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Smart article suggestions based on search query
  const suggestedArticles = useMemo(() => {
    if (!localSearchQuery.trim()) {
      return articles.slice(0, maxSuggestions);
    }

    const query = localSearchQuery.toLowerCase();
    const keywords = query.split(' ').filter(word => word.length > 3);

    // Score each article based on keyword matches
    const scoredArticles = articles.map(article => {
      let score = 0;
      const articleText = `${article.title} ${article.description} ${article.subsection}`.toLowerCase();

      // Title matches are worth more
      if (article.title.toLowerCase().includes(query)) {
        score += 10;
      }

      // Description matches
      if (article.description?.toLowerCase().includes(query)) {
        score += 5;
      }

      // Category matches
      if (article.subsection?.toLowerCase().includes(query)) {
        score += 3;
      }

      // Individual keyword matches
      keywords.forEach(keyword => {
        const matches = (articleText.match(new RegExp(keyword, 'gi')) || []).length;
        score += matches;
      });

      return { article, score };
    });

    // Return top scored articles
    return scoredArticles
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
      .map(({ article }) => article);
  }, [articles, localSearchQuery, maxSuggestions]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    trackArticleView(article.id);
  };

  const handleArticleVote = async (articleId: number, helpful: boolean) => {
    setVotedArticles(prev => ({ ...prev, [articleId]: helpful }));
    
    // Track vote in database
    await trackArticleHelpfulness(articleId, helpful);
    
    // Callback to parent
    onArticleHelpful?.(articleId, helpful);
  };

  const handleArticleSolved = (articleId: number) => {
    onArticleSolved?.(articleId);
    setSelectedArticle(null);
  };

  const trackArticleView = async (articleId: number) => {
    try {
      await supabase
        .from('ticket_kb_interactions')
        .insert([{
          article_id: articleId,
          organization_id: settings?.organization_id,
          interaction_type: 'view',
          search_query: localSearchQuery || null
        }]);
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  };

  const trackArticleHelpfulness = async (articleId: number, helpful: boolean) => {
    try {
      await supabase
        .from('ticket_kb_interactions')
        .insert([{
          article_id: articleId,
          organization_id: settings?.organization_id,
          interaction_type: helpful ? 'helpful' : 'not_helpful',
          search_query: localSearchQuery || null
        }]);
    } catch (error) {
      console.error('Error tracking article helpfulness:', error);
    }
  };

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Article Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-200">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            Back to suggestions
          </button>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedArticle.title}</h2>
          {selectedArticle.subsection && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {selectedArticle.subsection}
            </span>
          )}
        </div>

        {/* Article Content */}
        <div className="p-6 prose max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedArticle.content) }}
            className="text-slate-700"
          />
        </div>

        {/* Helpfulness Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Was this article helpful?</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleArticleVote(selectedArticle.id, true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  votedArticles[selectedArticle.id] === true
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <HandThumbUpIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Yes</span>
              </button>
              <button
                onClick={() => handleArticleVote(selectedArticle.id, false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  votedArticles[selectedArticle.id] === false
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <HandThumbDownIcon className="h-4 w-4" />
                <span className="text-sm font-medium">No</span>
              </button>
            </div>
          </div>
          
          {votedArticles[selectedArticle.id] === true && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 mb-3">Great! Did this solve your issue?</p>
              <button
                onClick={() => handleArticleSolved(selectedArticle.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Yes, issue resolved!</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (suggestedArticles.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-${compact ? '4' : '6'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <LightBulbIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {localSearchQuery ? 'Related Help Articles' : 'Popular Help Articles'}
          </h3>
          <p className="text-sm text-slate-600">
            These articles might help resolve your issue without creating a ticket
          </p>
        </div>
      </div>

      {/* Search Box */}
      {!compact && (
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Article Suggestions */}
      <div className="space-y-3">
        {suggestedArticles.map((article) => (
          <button
            key={article.id}
            onClick={() => handleArticleClick(article)}
            className="w-full text-left p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">
                  {article.title}
                </h4>
                {article.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {article.description}
                  </p>
                )}
                {article.subsection && (
                  <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                    {article.subsection}
                  </span>
                )}
              </div>
              <ArrowRightIcon className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* View All Link */}
      {!compact && articles.length > maxSuggestions && (
        <div className="mt-4 text-center">
          <a
            href="/help-center"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all {articles.length} help articles
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
