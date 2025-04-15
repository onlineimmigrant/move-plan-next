// src/components/PostPage/TOC.tsx
'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

interface TOCItem {
    tag_name: string;
    tag_text: string;
    tag_id: string;
}

interface TOCProps {
    toc: TOCItem[];
    handleScrollTo: (id: string) => void;
}

const TOC: React.FC<TOCProps> = ({ toc, handleScrollTo }) => {
    const { settings } = useSettings();
    
    if (!toc || toc.length === 0) return null;

    return (
        <div className="table-of-contents mr-16 ">
            <h2 className="mt-8 font-light text-sm text-gray-400 mb-4">On this page</h2>
            <ul className="text-sm font-normal text-gray-700">
                {toc.map((item, index) => (
                    <li
                        key={index}
                        className={` ${
                            item.tag_name === 'h2'
                                ? 'hover:text-gray-400 mt-2'
                                : item.tag_name === 'h3'
                                ? 'font-normal ml-2 hover:text-gray-400 mt-1 '
                                : item.tag_name === 'h4'
                                ? 'font-light ml-4 hover:text-gray-400 text-xs '
                                : 'font-light ml-6 hover:text-gray-400 '
                        }`}
                    >
                        <button 
                            onClick={() => handleScrollTo(item.tag_id)}
                            className="text-left w-full line-clamp-1"
                        >
                            {item.tag_text}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TOC;