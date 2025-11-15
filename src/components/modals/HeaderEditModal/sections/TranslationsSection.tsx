/**
 * TranslationsSection - Manage translations for Header Menu Items
 * 
 * Table-based layout showing translations for menu items and submenu items
 * Fetches original language and supported locales from organization settings
 */

'use client';

import React, { useState, useMemo } from 'react';
import { GlobeAltIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MenuItem, SubMenuItem } from '../types';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useHeaderEdit } from '../context';
import { mergeTranslations, prepareFieldsForTranslation } from '@/lib/services/translation-utils';
import Button from '@/ui/Button';

interface TranslationsSectionProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  primaryColor: string;
}

// Helper to get language name
const getLanguageName = (code: string): string => {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish',
    vi: 'Vietnamese',
    th: 'Thai',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
  };
  return languageNames[code] || code.toUpperCase();
};

export function TranslationsSection({ menuItems, setMenuItems, primaryColor }: TranslationsSectionProps) {
  const { settings } = useSettings();
  const { translateAll, isTranslating, progress } = useTranslation();
  const { updateMenuItems, isSaving } = useHeaderEdit();

  const originalLanguage = settings?.language || 'en';
  const supportedLocales = settings?.supported_locales || [];

  // Track if translations have been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Expanded menu items for submenu accordion
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());

  // JSONB Modal state
  const [jsonbModal, setJsonbModal] = useState<{
    isOpen: boolean;
    type: 'menu' | 'submenu';
    field: 'display_name_translation' | 'description_translation' | 'name_translation' | 'description_translation' | null;
    itemId: string;
    value: string;
  }>({
    isOpen: false,
    type: 'menu',
    field: null,
    itemId: '',
    value: '',
  });

  // Get all unique language codes from all menu items and submenu items
  const getAllLanguageCodes = (): string[] => {
    const codes = new Set<string>();
    
    menuItems.forEach(item => {
      Object.keys(item.display_name_translation || {}).forEach(code => codes.add(code));
      Object.keys(item.description_translation || {}).forEach(code => codes.add(code));
      
      item.submenu_items?.forEach(sub => {
        Object.keys(sub.name_translation || {}).forEach(code => codes.add(code));
        Object.keys(sub.description_translation || {}).forEach(code => codes.add(code));
      });
    });
    
    return Array.from(codes).sort();
  };

  const languageCodes = getAllLanguageCodes();

  // Update menu item translation
  const updateMenuItemTranslation = (
    menuItemId: string,
    field: 'display_name_translation' | 'description_translation',
    languageCode: string,
    value: string
  ) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === menuItemId) {
        return {
          ...item,
          [field]: {
            ...(item[field] || {}),
            [languageCode]: value,
          },
        } as MenuItem;
      }
      return item;
    }));
    setHasUnsavedChanges(true);
  };

  // Update submenu item translation
  const updateSubmenuItemTranslation = (
    menuItemId: string,
    submenuItemId: string,
    field: 'name_translation' | 'description_translation',
    languageCode: string,
    value: string
  ) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === menuItemId && item.submenu_items) {
        return {
          ...item,
          submenu_items: item.submenu_items.map(sub => {
            if (sub.id === submenuItemId) {
              return {
                ...sub,
                [field]: {
                  ...sub[field],
                  [languageCode]: value,
                },
              };
            }
            return sub;
          }),
        };
      }
      return item;
    }));
    setHasUnsavedChanges(true);
  };

  // Update original field for menu item
  const updateMenuItemOriginalField = (menuItemId: string, field: 'display_name' | 'description', value: string) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === menuItemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Update original field for submenu item
  const updateSubmenuItemOriginalField = (menuItemId: string, submenuItemId: string, field: 'name' | 'description', value: string) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === menuItemId && item.submenu_items) {
        return {
          ...item,
          submenu_items: item.submenu_items.map(sub => {
            if (sub.id === submenuItemId) {
              return { ...sub, [field]: value };
            }
            return sub;
          }),
        };
      }
      return item;
    }));
  };

  // Add all missing languages
  const addMissingLanguages = () => {
    const missing = supportedLocales.filter(locale => !languageCodes.includes(locale));
    
    if (missing.length === 0) {
      alert('All supported languages are already added!');
      return;
    }

    setMenuItems(menuItems.map(item => {
      const newDisplayNameTranslation = { ...item.display_name_translation };
      const newDescriptionTranslation = { ...item.description_translation };
      
      missing.forEach(code => {
        newDisplayNameTranslation[code] = '';
        newDescriptionTranslation[code] = '';
      });

      const updatedSubmenuItems = item.submenu_items?.map(sub => {
        const newNameTranslation = { ...sub.name_translation };
        const newDescTranslation = { ...sub.description_translation };
        
        missing.forEach(code => {
          newNameTranslation[code] = '';
          newDescTranslation[code] = '';
        });

        return {
          ...sub,
          name_translation: newNameTranslation,
          description_translation: newDescTranslation,
        };
      });

      return {
        ...item,
        display_name_translation: newDisplayNameTranslation,
        description_translation: newDescriptionTranslation,
        submenu_items: updatedSubmenuItems,
      };
    }));
    setHasUnsavedChanges(true);
  };

  // Remove a language
  const removeLanguage = (code: string) => {
    setMenuItems(menuItems.map(item => {
      const newDisplayNameTranslation = { ...item.display_name_translation };
      const newDescriptionTranslation = { ...item.description_translation };
      
      delete newDisplayNameTranslation[code];
      delete newDescriptionTranslation[code];

      const updatedSubmenuItems = item.submenu_items?.map(sub => {
        const newNameTranslation = { ...sub.name_translation };
        const newDescTranslation = { ...sub.description_translation };
        
        delete newNameTranslation[code];
        delete newDescTranslation[code];

        return {
          ...sub,
          name_translation: newNameTranslation,
          description_translation: newDescTranslation,
        };
      });

      return {
        ...item,
        display_name_translation: newDisplayNameTranslation,
        description_translation: newDescriptionTranslation,
        submenu_items: updatedSubmenuItems,
      };
    }));
    setHasUnsavedChanges(true);
  };

  // Open JSONB modal
  const openJsonbModal = (
    type: 'menu' | 'submenu',
    field: 'display_name_translation' | 'description_translation' | 'name_translation',
    itemId: string
  ) => {
    let currentValue = {};
    
    if (type === 'menu') {
      const item = menuItems.find(m => m.id === itemId);
      currentValue = (item?.[field as keyof MenuItem] as Record<string, any>) || {};
    } else {
      // Find submenu item across all menu items
      for (const menuItem of menuItems) {
        const subItem = menuItem.submenu_items?.find(s => s.id === itemId);
        if (subItem) {
          currentValue = (subItem[field as keyof SubMenuItem] as Record<string, any>) || {};
          break;
        }
      }
    }
    
    setJsonbModal({
      isOpen: true,
      type,
      field,
      itemId,
      value: JSON.stringify(currentValue, null, 2),
    });
  };

  // Close JSONB modal
  const closeJsonbModal = () => {
    setJsonbModal({
      isOpen: false,
      type: 'menu',
      field: null,
      itemId: '',
      value: '',
    });
  };

  // Apply JSONB data
  const applyJsonbData = () => {
    if (!jsonbModal.field || !jsonbModal.itemId) return;

    try {
      const parsed = JSON.parse(jsonbModal.value);
      
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        alert('Invalid JSON format. Please provide a valid object.');
        return;
      }

      if (jsonbModal.type === 'menu') {
        setMenuItems(menuItems.map(item => {
          if (item.id === jsonbModal.itemId) {
            return { ...item, [jsonbModal.field as string]: parsed } as MenuItem;
          }
          return item;
        }));
      } else {
        // Find and update submenu item
        setMenuItems(menuItems.map(menuItem => {
          if (menuItem.submenu_items) {
            const updatedSubmenuItems = menuItem.submenu_items.map(sub => {
              if (sub.id === jsonbModal.itemId) {
                return { ...sub, [jsonbModal.field as string]: parsed } as SubMenuItem;
              }
              return sub;
            });
            return { ...menuItem, submenu_items: updatedSubmenuItems };
          }
          return menuItem;
        }));
      }

      setHasUnsavedChanges(true);
      closeJsonbModal();
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  // AI Translate All Menu Items and Submenu Items
  const handleAITranslateAll = async () => {
    if (!menuItems || menuItems.length === 0) {
      alert('No menu items to translate.');
      return;
    }

    let translatedMenuCount = 0;
    let translatedSubmenuCount = 0;
    let skippedMenuCount = 0;
    let skippedSubmenuCount = 0;
    let updatedMenuItems = [...menuItems];

    // Helper function to check if a translation already exists for all target languages
    const needsTranslation = (
      existingTranslations: Record<string, any> | undefined,
      targetLanguages: string[]
    ): string[] => {
      if (!existingTranslations) return targetLanguages;
      
      // Return only languages that don't have translations yet
      return targetLanguages.filter(lang => {
        const translation = existingTranslations[lang];
        return !translation || (typeof translation === 'string' && !translation.trim());
      });
    };

    // Translate menu items
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      let itemTranslated = false;
      
      // Check which languages need translation for display_name
      const displayNameMissingLangs = needsTranslation(item.display_name_translation, supportedLocales);
      
      // Check which languages need translation for description
      const descriptionMissingLangs = item.description?.trim()
        ? needsTranslation(item.description_translation, supportedLocales)
        : [];

      // Translate display_name if needed
      if (displayNameMissingLangs.length > 0 && item.display_name?.trim()) {
        const result = await translateAll({
          tableName: 'website_menuitem',
          fields: [{ name: 'display_name', content: item.display_name }],
          sourceLanguage: originalLanguage,
          targetLanguages: displayNameMissingLangs,
        });

        if (result.success && result.translations?.display_name) {
          updatedMenuItems[i] = {
            ...updatedMenuItems[i],
            display_name_translation: {
              ...(updatedMenuItems[i].display_name_translation || {}),
              ...result.translations.display_name,
            },
          };
          itemTranslated = true;
        }
      }

      // Translate description if needed
      if (descriptionMissingLangs.length > 0 && item.description?.trim()) {
        const result = await translateAll({
          tableName: 'website_menuitem',
          fields: [{ name: 'description', content: item.description }],
          sourceLanguage: originalLanguage,
          targetLanguages: descriptionMissingLangs,
        });

        if (result.success && result.translations?.description) {
          updatedMenuItems[i] = {
            ...updatedMenuItems[i],
            description_translation: {
              ...(updatedMenuItems[i].description_translation || {}),
              ...result.translations.description,
            },
          };
          itemTranslated = true;
        }
      }

      // Count result
      if (itemTranslated) {
        translatedMenuCount++;
      } else if (displayNameMissingLangs.length === 0 && descriptionMissingLangs.length === 0) {
        skippedMenuCount++;
      }

      // Translate submenu items for this menu item
      if (item.submenu_items && item.submenu_items.length > 0) {
        const updatedSubmenuItems = [...item.submenu_items];
        
        for (let j = 0; j < item.submenu_items.length; j++) {
          const subItem = item.submenu_items[j];
          let subItemTranslated = false;
          
          // Check which languages need translation for name
          const nameMissingLangs = needsTranslation(subItem.name_translation, supportedLocales);
          
          // Check which languages need translation for description
          const subDescriptionMissingLangs = subItem.description?.trim()
            ? needsTranslation(subItem.description_translation, supportedLocales)
            : [];

          // Translate name if needed
          if (nameMissingLangs.length > 0 && subItem.name?.trim()) {
            const result = await translateAll({
              tableName: 'website_submenuitem',
              fields: [{ name: 'name', content: subItem.name }],
              sourceLanguage: originalLanguage,
              targetLanguages: nameMissingLangs,
            });

            if (result.success && result.translations?.name) {
              updatedSubmenuItems[j] = {
                ...updatedSubmenuItems[j],
                name_translation: {
                  ...(updatedSubmenuItems[j].name_translation || {}),
                  ...result.translations.name,
                },
              };
              subItemTranslated = true;
            }
          }

          // Translate description if needed
          if (subDescriptionMissingLangs.length > 0 && subItem.description?.trim()) {
            const result = await translateAll({
              tableName: 'website_submenuitem',
              fields: [{ name: 'description', content: subItem.description }],
              sourceLanguage: originalLanguage,
              targetLanguages: subDescriptionMissingLangs,
            });

            if (result.success && result.translations?.description) {
              updatedSubmenuItems[j] = {
                ...updatedSubmenuItems[j],
                description_translation: {
                  ...(updatedSubmenuItems[j].description_translation || {}),
                  ...result.translations.description,
                },
              };
              subItemTranslated = true;
            }
          }

          // Count result
          if (subItemTranslated) {
            translatedSubmenuCount++;
          } else if (nameMissingLangs.length === 0 && subDescriptionMissingLangs.length === 0) {
            skippedSubmenuCount++;
          }
        }

        updatedMenuItems[i] = {
          ...updatedMenuItems[i],
          submenu_items: updatedSubmenuItems,
        };
      }

      // Update UI after each menu item is processed
      setMenuItems([...updatedMenuItems]);
    }

    // Mark as having unsaved changes if any translations were made
    if (translatedMenuCount > 0 || translatedSubmenuCount > 0) {
      setHasUnsavedChanges(true);
    }

    // Show summary with skipped counts
    const summary = [
      translatedMenuCount > 0 ? `✓ Translated ${translatedMenuCount} menu items` : null,
      translatedSubmenuCount > 0 ? `✓ Translated ${translatedSubmenuCount} submenu items` : null,
      skippedMenuCount > 0 ? `⊘ Skipped ${skippedMenuCount} menu items (already translated)` : null,
      skippedSubmenuCount > 0 ? `⊘ Skipped ${skippedSubmenuCount} submenu items (already translated)` : null,
    ].filter(Boolean).join('\n');

    alert(summary || 'All translations are up to date!');
  };

  // Toggle menu item expansion
  const toggleMenuItemExpansion = (menuItemId: string) => {
    setExpandedMenuItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuItemId)) {
        newSet.delete(menuItemId);
      } else {
        newSet.add(menuItemId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Header with language information */}
      <div className="flex items-center gap-2 mb-4 px-2 sm:px-6">
        <GlobeAltIcon className="w-5 h-5" style={{ color: primaryColor }} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Original: <span className="font-medium">{getLanguageName(originalLanguage)}</span>
          {supportedLocales.length > 0 && (
            <span className="ml-2">
              • Supported: {supportedLocales.length} {supportedLocales.length === 1 ? 'language' : 'languages'}
            </span>
          )}
        </p>
      </div>

      {/* Menu Items Section - Accordion Layout */}
      <div className="mb-6 px-2 sm:px-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Menu Items</h3>
        
        <div className="space-y-2">
          {menuItems.map((menuItem) => (
            <div key={menuItem.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Accordion Header */}
              <button
                onClick={() => toggleMenuItemExpansion(menuItem.id)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {expandedMenuItems.has(menuItem.id) ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {menuItem.display_name}
                    </div>
                    {menuItem.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {menuItem.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {menuItem.submenu_items && menuItem.submenu_items.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {menuItem.submenu_items.length} submenu {menuItem.submenu_items.length === 1 ? 'item' : 'items'}
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                    {languageCodes.length} {languageCodes.length === 1 ? 'translation' : 'translations'}
                  </span>
                </div>
              </button>

              {/* Accordion Content - Translations Table */}
              {expandedMenuItems.has(menuItem.id) && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                            Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-32">
                            Language
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                            Display Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Original Language Row */}
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                          <td className="px-4 py-3">
                            <span 
                              className="text-xs font-bold px-2 py-1 rounded" 
                              style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                            >
                              {originalLanguage.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {getLanguageName(originalLanguage)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">(Original)</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              value={menuItem.display_name || ''}
                              onChange={(e) => updateMenuItemOriginalField(menuItem.id, 'display_name', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              value={menuItem.description || ''}
                              onChange={(e) => updateMenuItemOriginalField(menuItem.id, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                          </td>
                        </tr>

                        {/* Translation Rows */}
                        {languageCodes.map((languageCode) => (
                          <tr key={`${menuItem.id}-${languageCode}`} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <span 
                                className="text-xs font-bold px-2 py-1 rounded" 
                                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                              >
                                {languageCode.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {getLanguageName(languageCode)}
                                </span>
                                <button
                                  onClick={() => removeLanguage(languageCode)}
                                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove language"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={menuItem.display_name_translation?.[languageCode] || ''}
                                  onChange={(e) => updateMenuItemTranslation(menuItem.id, 'display_name_translation', languageCode, e.target.value)}
                                  rows={2}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                />
                                <button
                                  onClick={() => openJsonbModal('menu', 'display_name_translation', menuItem.id)}
                                  className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80 opacity-0 group-hover:opacity-100"
                                  style={{
                                    borderColor: `${primaryColor}40`,
                                    color: primaryColor,
                                    backgroundColor: `${primaryColor}10`,
                                  }}
                                  title="Edit as JSONB"
                                >
                                  {'{}'}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={menuItem.description_translation?.[languageCode] || ''}
                                  onChange={(e) => updateMenuItemTranslation(menuItem.id, 'description_translation', languageCode, e.target.value)}
                                  rows={2}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                />
                                <button
                                  onClick={() => openJsonbModal('menu', 'description_translation', menuItem.id)}
                                  className="px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors hover:opacity-80 opacity-0 group-hover:opacity-100"
                                  style={{
                                    borderColor: `${primaryColor}40`,
                                    color: primaryColor,
                                    backgroundColor: `${primaryColor}10`,
                                  }}
                                  title="Edit as JSONB"
                                >
                                  {'{}'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Submenu Items Section */}
                  {menuItem.submenu_items && menuItem.submenu_items.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Submenu Items</h4>
                      <div className="space-y-3">
                        {menuItem.submenu_items.map((subItem) => (
                          <div key={subItem.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-3 py-2 bg-purple-50/50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-medium text-gray-900 dark:text-white">
                                ↳ {subItem.name}
                              </div>
                              {subItem.description && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  {subItem.description}
                                </div>
                              )}
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-16">
                                      Code
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24">
                                      Language
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                                      Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                                      Description
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {/* Original Language Row */}
                                  <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                                    <td className="px-3 py-2">
                                      <span 
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded" 
                                        style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                                      >
                                        {originalLanguage.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="text-[10px] text-gray-500 dark:text-gray-400">(Original)</span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <textarea
                                        value={subItem.name || ''}
                                        onChange={(e) => updateSubmenuItemOriginalField(menuItem.id, subItem.id, 'name', e.target.value)}
                                        rows={1}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <textarea
                                        value={subItem.description || ''}
                                        onChange={(e) => updateSubmenuItemOriginalField(menuItem.id, subItem.id, 'description', e.target.value)}
                                        rows={1}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                      />
                                    </td>
                                  </tr>

                                  {/* Submenu Translation Rows */}
                                  {languageCodes.map((languageCode) => (
                                    <tr key={`${subItem.id}-${languageCode}`} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                      <td className="px-3 py-2">
                                        <span 
                                          className="text-[10px] font-bold px-1.5 py-0.5 rounded" 
                                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                        >
                                          {languageCode.toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] text-gray-700 dark:text-gray-300">
                                            {getLanguageName(languageCode)}
                                          </span>
                                          <button
                                            onClick={() => removeLanguage(languageCode)}
                                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove language"
                                          >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <textarea
                                          value={subItem.name_translation?.[languageCode] || ''}
                                          onChange={(e) => updateSubmenuItemTranslation(menuItem.id, subItem.id, 'name_translation', languageCode, e.target.value)}
                                          rows={1}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <textarea
                                          value={subItem.description_translation?.[languageCode] || ''}
                                          onChange={(e) => updateSubmenuItemTranslation(menuItem.id, subItem.id, 'description_translation', languageCode, e.target.value)}
                                          rows={1}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-y"
                                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-30 rounded-b-2xl">
        <button
          onClick={addMissingLanguages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 cursor-pointer"
          style={{
            borderColor: `${primaryColor}40`,
            color: primaryColor,
            backgroundColor: `${primaryColor}10`,
          }}
          title="Add languages from supported locales"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Missing Languages</span>
          <span className="sm:hidden">Add Languages</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAITranslateAll}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: isTranslating ? '#94a3b8' : `${primaryColor}40`,
              color: isTranslating ? '#64748b' : primaryColor,
              backgroundColor: isTranslating ? '#f1f5f9' : `${primaryColor}10`,
            }}
            title={isTranslating ? "Translating..." : "Translate all menu items and submenu items using AI"}
          >
            {isTranslating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                <span className="hidden sm:inline">
                  {progress ? `Translating... (${progress.completed}/${progress.total})` : 'Translating...'}
                </span>
                <span className="sm:hidden">Translating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">AI Translate All</span>
                <span className="sm:hidden">AI Translate</span>
              </>
            )}
          </button>

          <Button
            variant="primary"
            onClick={async () => {
              await updateMenuItems(menuItems);
              setHasUnsavedChanges(false);
            }}
            loading={isSaving}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-1.5 text-xs"
          >
            Save
          </Button>
        </div>
      </div>

      {/* JSONB Modal */}
      {jsonbModal.isOpen && jsonbModal.field && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit JSONB - {jsonbModal.field.replace('_translation', '').replace('_', ' ')}
              </h3>
              <button
                onClick={closeJsonbModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <textarea
                value={jsonbModal.value}
                onChange={(e) => setJsonbModal({ ...jsonbModal, value: e.target.value })}
                placeholder={`{\n  "de": "German translation",\n  "es": "Spanish translation",\n  "fr": "French translation"\n}`}
                rows={15}
                className="w-full px-4 py-3 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent resize-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Paste JSONB object with language codes as keys. Example: {`{"en": "Hello", "de": "Hallo"}`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeJsonbModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyJsonbData}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
