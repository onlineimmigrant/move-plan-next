'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  CommandLineIcon,
  XMarkIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useTemplateSectionEdit } from '@/components/modals/TemplateSectionModal/context';
import { useTemplateHeadingSectionEdit } from '@/components/modals/TemplateHeadingSectionModal/context';
import { usePageCreation } from '@/components/modals/PageCreationModal/context';

interface Command {
  id: string;
  label: string;
  description: string;
  category: string;
  action: string;
  keywords: string[];
  shortcut?: string;
  disabled?: boolean;
}

const CommandPalette: React.FC = () => {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const { openModal: openSectionModal } = useTemplateSectionEdit();
  const { openModal: openHeadingSectionModal } = useTemplateHeadingSectionEdit();
  const { openModal: openPageModal } = usePageCreation();

  // Load recent commands from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentCommands');
      if (stored) {
        setRecentCommands(JSON.parse(stored));
      }
    }
  }, []);

    // Define all available commands - matching UniversalNewButton structure
  const allCommands: Command[] = [
    // Content commands
    {
      id: 'new-heading',
      label: 'New Heading Section',
      description: 'Add a heading with CTA',
      category: 'Content',
      action: 'heading',
      keywords: ['heading', 'title', 'cta', 'call to action', 'hero', 'new'],
      shortcut: '⌘⇧H',
    },
    {
      id: 'new-section',
      label: 'New Section',
      description: 'Add a new content section',
      category: 'Content',
      action: 'section',
      keywords: ['section', 'content', 'block', 'new', 'create'],
      shortcut: '⌘⇧S',
    },
    {
      id: 'new-hero',
      label: 'New Hero Section',
      description: 'Coming soon',
      category: 'Content',
      action: 'hero',
      keywords: ['hero', 'banner', 'landing', 'main', 'new'],
      disabled: true,
    },
    // Navigation commands
    {
      id: 'new-menu',
      label: 'New Menu Item',
      description: 'Coming soon',
      category: 'Navigation',
      action: 'menu',
      keywords: ['menu', 'navigation', 'nav', 'link', 'new'],
      disabled: true,
    },
    {
      id: 'new-submenu',
      label: 'New Submenu',
      description: 'Coming soon',
      category: 'Navigation',
      action: 'submenu',
      keywords: ['submenu', 'dropdown', 'nested', 'child', 'new'],
      disabled: true,
    },
    // Pages commands
    {
      id: 'new-page',
      label: 'New Empty Page',
      description: 'Create a template-based page',
      category: 'Pages',
      action: 'page',
      keywords: ['page', 'empty', 'blank', 'new', 'template'],
    },
    {
      id: 'new-post',
      label: 'New Blog Post',
      description: 'Coming soon',
      category: 'Pages',
      action: 'post',
      keywords: ['blog', 'post', 'article', 'content', 'new'],
      shortcut: '⌘⇧P',
      disabled: true,
    },
    // Products commands
    {
      id: 'new-product-page',
      label: 'New Product Page',
      description: 'Coming soon',
      category: 'Products',
      action: 'product_page',
      keywords: ['product', 'page', 'item', 'service', 'new'],
      disabled: true,
    },
    {
      id: 'new-pricing-plan',
      label: 'New Pricing Plan',
      description: 'Coming soon',
      category: 'Products',
      action: 'pricing_plan',
      keywords: ['pricing', 'plan', 'subscription', 'price', 'new'],
      disabled: true,
    },
    // Interactive commands
    {
      id: 'new-faq',
      label: 'New FAQ',
      description: 'Coming soon',
      category: 'Interactive',
      action: 'faq',
      keywords: ['faq', 'question', 'answer', 'help', 'new'],
      disabled: true,
    },
    {
      id: 'new-feature',
      label: 'New Feature',
      description: 'Coming soon',
      category: 'Interactive',
      action: 'feature',
      keywords: ['feature', 'highlight', 'benefit', 'capability', 'new'],
      disabled: true,
    },
    // General commands
    {
      id: 'global-settings',
      label: 'Global Settings',
      description: 'Coming soon',
      category: 'General',
      action: 'global_settings',
      keywords: ['settings', 'config', 'configuration', 'global', 'site'],
      disabled: true,
    },
    {
      id: 'site-map',
      label: 'Site Map',
      description: 'Coming soon',
      category: 'General',
      action: 'site_map',
      keywords: ['sitemap', 'map', 'structure', 'pages', 'navigation'],
      disabled: true,
    },
  ];

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent commands if no search query
      if (recentCommands.length > 0) {
        return allCommands.filter(cmd => recentCommands.includes(cmd.id));
      }
      return allCommands;
    }

    const query = searchQuery.toLowerCase();
    return allCommands.filter(cmd => {
      return (
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query) ||
        cmd.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, recentCommands, allCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        // Cmd/Ctrl + K to open palette
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsOpen(true);
          return;
        }

        // Individual shortcuts when palette is closed
        if (isAdmin) {
          // Cmd/Ctrl + Shift + S for new section
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            executeCommand('section');
            return;
          }
          // Cmd/Ctrl + Shift + H for new heading
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            executeCommand('heading');
            return;
          }
          // Cmd/Ctrl + Shift + P for new post
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            executeCommand('post');
            return;
          }
        }
        return;
      }

      // When palette is open
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeAndReset();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex].action);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, isAdmin]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  const closeAndReset = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  const addToRecent = (commandId: string) => {
    const updated = [commandId, ...recentCommands.filter(id => id !== commandId)].slice(0, 5);
    setRecentCommands(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentCommands', JSON.stringify(updated));
    }
  };

  const executeCommand = (action: string) => {
    // Find the command to add to recent
    const command = allCommands.find(cmd => cmd.action === action);
    if (command) {
      addToRecent(command.id);
    }

    closeAndReset();

    // Execute the action - matching UniversalNewButton
    switch (action) {
      case 'heading':
        openHeadingSectionModal(undefined, pathname);
        break;
      case 'section':
        openSectionModal(null, pathname);
        break;
      case 'page':
        openPageModal();
        break;
      case 'hero':
      case 'menu':
      case 'submenu':
      case 'post':
      case 'product_page':
      case 'pricing_plan':
      case 'faq':
      case 'feature':
      case 'global_settings':
      case 'site_map':
        alert(`Creating ${action} - Coming soon!`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Don't render if not admin
  if (!isAdmin) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] animate-in fade-in duration-200"
          onClick={closeAndReset}
        />
      )}

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-[71]
                       animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 
                         rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] 
                         border border-gray-200/60 overflow-hidden">
            
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200/50">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands or type a keyword..."
                className="flex-1 bg-transparent border-none outline-none text-gray-800 
                         placeholder:text-gray-400 text-base"
              />
              <button
                onClick={closeAndReset}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Results */}
            <div 
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto py-2"
            >
              {filteredCommands.length === 0 ? (
                // No results
                <div className="px-4 py-12 text-center">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No commands found</p>
                  <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <>
                  {/* Show "Recent" header if showing recent commands */}
                  {!searchQuery.trim() && recentCommands.length > 0 && (
                    <div className="px-4 py-2 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Recent
                      </span>
                    </div>
                  )}

                  {/* Commands grouped by category */}
                  {Object.entries(groupedCommands).map(([category, commands], categoryIndex) => (
                    <div key={category}>
                      {/* Category header (skip if showing recent) */}
                      {(searchQuery.trim() || recentCommands.length === 0) && (
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category}
                        </div>
                      )}

                      {/* Commands */}
                      {commands.map((command, cmdIndex) => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === command.id);
                        const isSelected = globalIndex === selectedIndex;
                        const isComingSoon = !['section', 'heading'].includes(command.action);

                        return (
                          <button
                            key={command.id}
                            data-index={globalIndex}
                            onClick={() => !isComingSoon && executeCommand(command.action)}
                            disabled={isComingSoon}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 
                                      transition-colors text-left
                                      ${isSelected 
                                        ? 'bg-gradient-to-r from-blue-50 to-transparent' 
                                        : 'hover:bg-gray-50'
                                      }
                                      ${isComingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium text-sm ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                  {command.label}
                                </p>
                                {isComingSoon && (
                                  <span className="text-xs text-gray-400 font-normal">
                                    (Soon)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {command.description}
                              </p>
                            </div>

                            {command.shortcut && !isComingSoon && (
                              <div className="flex-shrink-0 px-2 py-1 bg-gray-100 rounded text-xs 
                                           font-mono text-gray-600">
                                {command.shortcut}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200/50 bg-gray-50/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">esc</kbd>
                    Close
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CommandLineIcon className="w-3.5 h-3.5" />
                  <span>⌘K to open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommandPalette;
