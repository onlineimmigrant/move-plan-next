// src/components/PostPage/TOC.tsx
'use client';

import React, { memo, useMemo, useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Table of Contents item structure
 */
interface TOCItem {
    tag_name: string;
    tag_text: string;
    tag_id: string;
    children?: TOCItem[];
}

/**
 * Props for TOC component
 */
interface TOCProps {
    /** Array of hierarchical TOC items */
    toc: TOCItem[];
    /** Callback to handle scrolling to a heading */
    handleScrollTo: (id: string) => void;
}

/**
 * Recursive TOC Item Component
 * 
 * Renders individual TOC items with collapsible nested sections.
 * Auto-expands when child items are active, highlights current section.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {TOCItem} props.item - TOC item data
 * @param {Function} props.handleScrollTo - Scroll handler
 * @param {number} props.level - Nesting level for indentation
 * @param {string} props.activeHeadingId - Currently active heading ID
 */
const TOCItemComponent: React.FC<{
    item: TOCItem;
    handleScrollTo: (id: string) => void;
    level: number;
    activeHeadingId?: string;
}> = memo(({ item, handleScrollTo, level, activeHeadingId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const themeColors = useThemeColors();
    const hasChildren = item.children && item.children.length > 0;
    const isActive = activeHeadingId === item.tag_id;
    // Use active shade (darker) for better contrast on white backgrounds
    const primary = themeColors.cssVars.primary.active;

    // Auto-expand if this item or a child is active
    useEffect(() => {
        if (hasChildren && item.children) {
            const hasActiveChild = item.children.some(child => child.tag_id === activeHeadingId);
            if (hasActiveChild || isActive) {
                setIsOpen(true);
            }
        }
    }, [activeHeadingId, isActive, hasChildren, item.children]);

    const getItemStyle = (tagName: string) => {
        const isH2 = tagName === 'h2';
        const isH3 = tagName === 'h3';
        
        if (isH2) {
            return {
                marginTop: '0.5rem',
                marginBottom: '0.25rem',
            };
        } else if (isH3) {
            return {
                marginLeft: '0.75rem',
                marginTop: '0.25rem',
            };
        } else {
            return {
                marginLeft: '1.5rem',
                marginTop: '0.25rem',
            };
        }
    };

    // Get font weight based on heading level
    const getFontWeight = (tagName: string) => {
        return tagName === 'h2' ? 'font-semibold' : 'font-normal';
    };

    return (
        <li style={getItemStyle(item.tag_name)}>
            <div className="flex items-center gap-2">
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
                        aria-label={isOpen ? `Collapse ${item.tag_text}` : `Expand ${item.tag_text}`}
                        aria-expanded={isOpen}
                    >
                        <ChevronDownIcon 
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </button>
                )}
                <button
                    onClick={() => handleScrollTo(item.tag_id)}
                    className={`flex-1 text-left py-1.5 px-2.5 rounded-lg transition-all text-sm leading-tight relative ${
                        isActive 
                            ? getFontWeight(item.tag_name)
                            : `${getFontWeight(item.tag_name)} text-gray-600 hover:bg-gray-50`
                    } ${!hasChildren ? 'ml-5' : ''}`}
                    aria-current={isActive ? 'location' : undefined}
                    aria-label={`Navigate to ${item.tag_text}`}
                    style={
                        isActive
                            ? {
                                backgroundColor: `color-mix(in srgb, ${primary} 3%, transparent)`,
                                borderColor: `color-mix(in srgb, ${primary} 8%, transparent)`,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                color: primary,
                            }
                            : {}
                    }
                >
                    {isActive && (
                        <div 
                            className="absolute right-0 top-0 bottom-0 w-1 rounded-r-lg"
                            style={{ backgroundColor: primary }}
                        />
                    )}
                    <span className="block relative z-10 line-clamp-2">
                        {item.tag_text}
                    </span>
                </button>
            </div>
            {hasChildren && isOpen && (
                <ul className="mt-1">
                    {item.children!.map((child, index) => (
                        <TOCItemComponent
                            key={`${child.tag_id}-${index}`}
                            item={child}
                            handleScrollTo={handleScrollTo}
                            level={level + 1}
                            activeHeadingId={activeHeadingId}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
});

TOCItemComponent.displayName = 'TOCItemComponent';

const TOC: React.FC<TOCProps> = memo(({ toc, handleScrollTo }) => {
    const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>();

    // Track active heading using IntersectionObserver (more efficient than scroll listener)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id]');
        if (headingElements.length === 0) return;

        const observerOptions: IntersectionObserverInit = {
            rootMargin: '-100px 0px -66% 0px', // Trigger when heading is in top third of viewport
            threshold: 0,
        };

        const observerCallback: IntersectionObserverCallback = (entries) => {
            // Find the first visible heading in the viewport
            const visibleHeadings = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => {
                    // Sort by position in document
                    return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top;
                });

            if (visibleHeadings.length > 0) {
                const firstVisible = visibleHeadings[0].target as HTMLElement;
                setActiveHeadingId(firstVisible.id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe all headings
        headingElements.forEach(heading => observer.observe(heading));

        return () => {
            observer.disconnect();
        };
    }, []);

    // Build hierarchical structure from flat TOC list
    const hierarchicalTOC = useMemo(() => {
        if (!toc || toc.length === 0) return [];

        const result: TOCItem[] = [];
        const stack: { item: TOCItem; level: number }[] = [];

        toc.forEach((item) => {
            const level = parseInt(item.tag_name.substring(1)); // Extract number from 'h2', 'h3', etc.
            const tocItem: TOCItem = { ...item, children: [] };

            // Find the appropriate parent
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                // Top-level item
                result.push(tocItem);
            } else {
                // Add as child to the last item in stack
                const parent = stack[stack.length - 1].item;
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(tocItem);
            }

            stack.push({ item: tocItem, level });
        });

        return result;
    }, [toc]);

    // Early return for empty TOC
    if (!toc || toc.length === 0) return null;

    return (
        <nav 
            className="table-of-contents sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto" 
            aria-label="Table of contents"
        >
            <div className="p-4 rounded-lg">
                <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">
                    On this page
                </h2>
                <ul className="space-y-0.5" role="list">
                    {hierarchicalTOC.map((item, index) => (
                        <TOCItemComponent
                            key={`${item.tag_id}-${index}`}
                            item={item}
                            handleScrollTo={handleScrollTo}
                            level={parseInt(item.tag_name.substring(1))}
                            activeHeadingId={activeHeadingId}
                        />
                    ))}
                </ul>
            </div>
        </nav>
    );
});

TOC.displayName = 'TOC';

/**
 * Table of Contents Component
 * 
 * Displays hierarchical navigation for post headings with:
 * - Active section highlighting
 * - Collapsible nested sections
 * - Smooth scroll navigation
 * - Automatic active section detection (debounced)
 * 
 * @component
 * @param {TOCProps} props - Component props
 * @param {TOCItem[]} props.toc - Array of TOC items
 * @param {Function} props.handleScrollTo - Scroll handler for navigation
 * 
 * @example
 * <TOC toc={tocItems} handleScrollTo={handleScroll} />
 * 
 * @accessibility
 * - Uses semantic nav and list elements
 * - Includes ARIA labels and current location indicators
 * - Keyboard navigable with Tab
 * 
 * @performance
 * - Memoized to prevent re-renders
 * - Scroll events debounced to 100ms
 */
export default TOC;