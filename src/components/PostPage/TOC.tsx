// src/components/PostPage/TOC.tsx
'use client';

import React, { memo, useMemo, useState } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';


interface TOCItem {
    tag_name: string;
    tag_text: string;
    tag_id: string;
    children?: TOCItem[];
}

interface TOCProps {
    toc: TOCItem[];
    handleScrollTo: (id: string) => void;
}

// Recursive component to render TOC items with collapsible nested sections
const TOCItemComponent: React.FC<{
    item: TOCItem;
    handleScrollTo: (id: string) => void;
    level: number;
}> = memo(({ item, handleScrollTo, level }) => {
    const [isOpen, setIsOpen] = useState(false);
    const themeColors = useThemeColors();
    const hasChildren = item.children && item.children.length > 0;

    const getItemClassName = (tagName: string) => {
        const baseClasses = 'hover:text-gray-400 transition-colors duration-200';
        switch (tagName) {
            case 'h2':
                return `${baseClasses} mt-2`;
            case 'h3':
                return `${baseClasses} font-normal ml-2 mt-1`;
            case 'h4':
                return `${baseClasses} font-light ml-4 text-xs`;
            default:
                return `${baseClasses} font-light ml-6`;
        }
    };

    return (
        <li className={getItemClassName(item.tag_name)}>
            <div className="flex items-start gap-1">
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex-shrink-0 w-4 h-4 mt-1 focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded"
                        style={{ 
                            '--tw-ring-color': themeColors.cssVars.primary.base 
                        } as React.CSSProperties}
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => handleScrollTo(item.tag_id)}
                    className={`text-left flex-1 line-clamp-1 focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded px-1 py-0.5 ${!hasChildren ? 'ml-5' : ''}`}
                    style={{ 
                        '--tw-ring-color': themeColors.cssVars.primary.base 
                    } as React.CSSProperties}
                    aria-label={`Navigate to ${item.tag_text}`}
                >
                    {item.tag_text}
                </button>
            </div>
            {hasChildren && isOpen && (
                <ul className="text-sm font-normal text-gray-700">
                    {item.children!.map((child, index) => (
                        <TOCItemComponent
                            key={`${child.tag_id}-${index}`}
                            item={child}
                            handleScrollTo={handleScrollTo}
                            level={level + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
});

TOCItemComponent.displayName = 'TOCItemComponent';

const TOC: React.FC<TOCProps> = memo(({ toc, handleScrollTo }) => {
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
        <div className="table-of-contents mr-16 bg-white p-4 rounded-lg">
            <h2 className="mt-8 font-light text-sm text-gray-400 mb-4">On this page</h2>
            <ul className="text-sm font-normal text-gray-700">
                {hierarchicalTOC.map((item, index) => (
                    <TOCItemComponent
                        key={`${item.tag_id}-${index}`}
                        item={item}
                        handleScrollTo={handleScrollTo}
                        level={parseInt(item.tag_name.substring(1))}
                    />
                ))}
            </ul>
        </div>
    );
});

TOC.displayName = 'TOC';

export default TOC;