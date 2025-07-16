// src/components/PostPage/TOC.tsx
'use client';

import React, { memo, useMemo } from 'react';


interface TOCItem {
    tag_name: string;
    tag_text: string;
    tag_id: string;
}

interface TOCProps {
    toc: TOCItem[];
    handleScrollTo: (id: string) => void;
}

const TOC: React.FC<TOCProps> = memo(({ toc, handleScrollTo }) => {
    // Memoize the styling classes for different heading levels
    const getItemClassName = useMemo(() => (tagName: string) => {
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
    }, []);

    // Early return for empty TOC
    if (!toc || toc.length === 0) return null;

    return (
        <div className="table-of-contents mr-16">
            <h2 className="mt-8 font-light text-sm text-gray-400 mb-4">On this page</h2>
            <ul className="text-sm font-normal text-gray-700">
                {toc.map((item, index) => (
                    <li
                        key={`${item.tag_id}-${index}`}
                        className={getItemClassName(item.tag_name)}
                    >
                        <button 
                            onClick={() => handleScrollTo(item.tag_id)}
                            className="text-left w-full line-clamp-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 py-0.5"
                            aria-label={`Navigate to ${item.tag_text}`}
                        >
                            {item.tag_text}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
});

TOC.displayName = 'TOC';

export default TOC;