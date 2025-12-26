import React from 'react';
import { ChevronRight, Info, Minus } from 'lucide-react';
import { StatusDot } from '../StatusDot';
import {
  TABLE_CELL_PADDING,
  TABLE_FIRST_COL_WIDTH,
  TABLE_COL_WIDTH,
  OURS_COL_BORDER,
  COMP_COL_BORDER,
} from '../../constants';
import { mixWithTransparent } from '../../utils/colors';
import { formatMoney } from '../../utils/formatting';

/**
 * FeatureTable component displays the hierarchical feature comparison table.
 * Includes collapsible sections for hubs and modules.
 */
interface Feature {
  id: string;
  name: string;
  description?: string;
  content?: string;
  plan_id: string;
  display_on_product_card?: boolean;
  hub?: string;
  module?: string;
  order?: number;
}

interface Competitor {
  id: string;
  name: string;
  logo?: string;
  data?: any;
}

interface ComparisonConfig {
  ui?: {
    highlight_ours?: boolean;
    [key: string]: any;
  };
  features?: {
    filter?: {
      display_on_product?: boolean;
    };
  };
  [key: string]: any;
}

interface FeatureTableProps {
  sortedHierarchy: Array<{
    hubName: string;
    hubData: any;
    sortedModules: Array<{
      moduleName: string;
      moduleData: any;
      sortedFeatures: Feature[];
    }>;
  }>;
  competitors: Competitor[];
  config: ComparisonConfig;
  themeColors: any;
  competitorFeatureIndex: Map<string, Map<string, any>>;
  aggregatedStatusCache: Map<string, 'available' | 'partial' | 'unavailable' | 'unknown'>;
  expandedHubs: Set<string>;
  expandedModules: Set<string>;
  expandedFeatures: Set<string>;
  toggleHub: (hubName: string) => void;
  toggleModule: (moduleKey: string) => void;
  toggleFeatureExpansion: (featureId: string) => void;
  searchQuery: string;
  makeCompetitorFeatureKey: (planId: string, featureId: string) => string;
}

/**
 * Highlights search query matches in text
 */
function highlightMatch(text: string, query: string): JSX.Element | string {
  if (!query || !query.trim()) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 font-medium">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function FeatureTable({
  sortedHierarchy,
  competitors,
  config,
  themeColors,
  competitorFeatureIndex,
  aggregatedStatusCache,
  expandedHubs,
  expandedModules,
  expandedFeatures,
  toggleHub,
  toggleModule,
  toggleFeatureExpansion,
  searchQuery,
  makeCompetitorFeatureKey,
}: FeatureTableProps) {
  // Level 1 accordion: always keep one hub open when any hubs exist
  const firstHubName = sortedHierarchy[0]?.hubName ?? null;
  const renderExpandedHubs = 
    expandedHubs.size > 0
      ? expandedHubs
      : firstHubName
        ? new Set([firstHubName])
        : new Set<string>();

  return (
    <>
      {sortedHierarchy.map(({ hubName, hubData, sortedModules }) => {
        const hubFeature = hubData.hubFeature;
        const isHubOpen = renderExpandedHubs.has(hubName);

        const isHubExpanded = hubFeature ? expandedFeatures.has(hubFeature.id) : false;
        const hubDetailsRowId = hubFeature ? `hub-details-${hubFeature.id}` : '';
        const hasHubContent = hubFeature?.content && hubFeature.content.trim();
        const hasHubNotes = hubFeature
          ? competitors.some((c) => {
              const cf = competitorFeatureIndex
                .get(c.id)
                ?.get(makeCompetitorFeatureKey(hubFeature.plan_id, hubFeature.id));
              return cf?.note && cf.note.trim();
            })
          : false;
        const showHubExpandIcon = hasHubContent || hasHubNotes;

        return (
          <React.Fragment key={hubName}>
            {/* Level 1: Hub Header */}
            <tr
              className="border-y cursor-pointer"
              onClick={() => toggleHub(hubName)}
              style={{
                ['--primary' as any]: themeColors.cssVars.primary.base,
                backgroundImage: `linear-gradient(to right, ${
                  mixWithTransparent(themeColors.cssVars.primary.lighter, 64)
                }, ${mixWithTransparent(themeColors.cssVars.primary.lighter, 48)})`,
                borderColor: mixWithTransparent(themeColors.cssVars.primary.lighter, 74),
              }}
            >
              <td
                colSpan={2 + competitors.length}
                className={`${TABLE_CELL_PADDING} text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-900`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHub(hubName);
                    }}
                    className="flex-1 min-w-0 whitespace-normal text-left"
                    aria-expanded={isHubOpen}
                    aria-label={`Toggle ${hubName}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChevronRight
                        className={
                          `h-4 w-4 shrink-0 transition-transform duration-150 ease-out ` +
                          (isHubOpen ? 'rotate-90 opacity-100' : 'rotate-0 opacity-80')
                        }
                        aria-hidden="true"
                      />
                      <span className="min-w-0 whitespace-normal uppercase">{hubName}</span>
                    </span>
                  </button>
                  {showHubExpandIcon && hubFeature && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatureExpansion(hubFeature.id);
                      }}
                      className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-(--primary) transition-colors focus-visible:outline-none"
                      aria-label={`${isHubExpanded ? 'Hide' : 'Show'} details for ${hubName}`}
                      aria-expanded={isHubExpanded}
                      aria-controls={hubDetailsRowId}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>

            {/* Hub Details Row (if expanded) */}
            {isHubOpen && isHubExpanded && hubFeature && (
              <tr
                id={hubDetailsRowId}
                className="border-b"
                style={{
                  backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 22%, transparent)`,
                }}
              >
                <td className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_FIRST_COL_WIDTH}`}>
                  {hasHubContent && (
                    <div className="text-xs text-gray-600 whitespace-normal">
                      {hubFeature.content}
                    </div>
                  )}

                  {hasHubNotes && (
                    <div className="mt-3 md:hidden">
                      {competitors.map((competitor) => {
                        const competitorHubFeature = competitorFeatureIndex
                          .get(competitor.id)
                          ?.get(makeCompetitorFeatureKey(hubFeature.plan_id, hubFeature.id));
                        const note = competitorHubFeature?.note;
                        if (!note || !note.trim()) return null;
                        return (
                          <div key={competitor.id} className="mt-2">
                            <div className="text-[11px] font-semibold text-gray-700">
                              {competitor.name}
                            </div>
                            <div className="text-xs text-gray-600 whitespace-normal">
                              {note}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}></td>
                {competitors.map((competitor) => {
                  const competitorHubFeature = competitorFeatureIndex
                    .get(competitor.id)
                    ?.get(makeCompetitorFeatureKey(hubFeature.plan_id, hubFeature.id));
                  const note = competitorHubFeature?.note;

                  return (
                    <td key={competitor.id} className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_COL_WIDTH} text-center ${COMP_COL_BORDER}`}>
                      {note && (
                        <div className="hidden md:block text-xs text-gray-600 whitespace-normal text-center">
                          {note}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Level 2 & 3: Modules and Features */}
            {isHubOpen &&
              sortedModules.map(({ moduleName, moduleData, sortedFeatures }) => {
                const moduleFeature = moduleData.moduleFeature;
                
                // Unique module key for accordion state
                const moduleKey = `${hubName}|${moduleName}`;
                const isModuleOpen = expandedModules.has(moduleKey);
                const hasLevel3Features = sortedFeatures.length > 0;
                
                // Module expansion state for info/details (independent from accordion)
                const isModuleExpanded = moduleFeature ? expandedFeatures.has(moduleFeature.id) : false;
                const moduleDetailsRowId = moduleFeature ? `module-details-${moduleFeature.id}` : '';
                const hasModuleContent = moduleFeature?.content && moduleFeature.content.trim();
                const hasModuleNotes = moduleFeature ? competitors.some(c => {
                  const cf = competitorFeatureIndex
                    .get(c.id)
                    ?.get(makeCompetitorFeatureKey(moduleFeature.plan_id, moduleFeature.id));
                  return cf?.note && cf.note.trim();
                }) : false;
                const showModuleExpandIcon = hasModuleContent || hasModuleNotes;
                
                return (
                  <React.Fragment key={moduleName}>
                    {/* Module Header */}
                    <tr
                      className={isModuleExpanded ? '' : 'border-b'}
                      style={{
                        ['--primary' as any]: themeColors.cssVars.primary.base,
                        backgroundImage: `linear-gradient(to right, ${
                          mixWithTransparent(themeColors.cssVars.primary.lighter, 12)
                        }, ${mixWithTransparent(themeColors.cssVars.primary.lighter, 7)})`,
                        borderColor: mixWithTransparent(themeColors.cssVars.primary.lighter, 22),
                      }}
                    >
                      <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm font-semibold ${TABLE_FIRST_COL_WIDTH}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 whitespace-normal">
                            {moduleName}
                          </div>
                          <div className="flex items-center gap-1">
                            {hasLevel3Features && (
                              <button
                                type="button"
                                onClick={() => toggleModule(moduleKey)}
                                className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-(--primary) transition-colors focus-visible:outline-none"
                                style={{ ['--primary' as any]: themeColors.cssVars.primary.base }}
                                aria-label={`${isModuleOpen ? 'Collapse' : 'Expand'} ${moduleName} features`}
                                aria-expanded={isModuleOpen}
                              >
                                {isModuleOpen ? <Minus className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                              </button>
                            )}
                            {showModuleExpandIcon && moduleFeature && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFeatureExpansion(moduleFeature.id);
                                }}
                                className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-(--primary) transition-colors focus-visible:outline-none"
                                style={{ ['--primary' as any]: themeColors.cssVars.primary.base }}
                                aria-label={`${isModuleExpanded ? 'Hide' : 'Show'} details for ${moduleName}`}
                                aria-expanded={isModuleExpanded}
                                aria-controls={moduleDetailsRowId}
                              >
                                {isModuleExpanded ? <Minus className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-center ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}
                        style={{
                          backgroundColor: config.ui?.highlight_ours
                            ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 12%, transparent)`
                            : 'transparent',
                        }}
                      >
                        <StatusDot status="available" primaryColor={themeColors.cssVars.primary.base} />
                      </td>
                      {competitors.map((competitor) => {
                        // Use cached aggregated status
                        const cacheKey = `${hubName}|${moduleName}|${competitor.id}`;
                        const aggregatedStatus = aggregatedStatusCache.get(cacheKey) || 'unavailable';
                        
                        return (
                          <td key={competitor.id} className={`px-3 py-2.5 text-center ${TABLE_COL_WIDTH} ${COMP_COL_BORDER}`}>
                            <StatusDot status={aggregatedStatus} primaryColor={themeColors.cssVars.primary.base} />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Module Details Row (if expanded) */}
                    {isModuleExpanded && moduleFeature && (
                      <tr
                        id={moduleDetailsRowId}
                        className="border-b"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 10%, transparent)`,
                          borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 22%, transparent)`,
                        }}
                      >
                        <td className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_FIRST_COL_WIDTH}`}>
                          {hasModuleContent && (
                            <div className="text-xs text-gray-600 whitespace-normal">
                              {moduleFeature.content}
                            </div>
                          )}

                          {hasModuleNotes && (
                            <div className="mt-3 md:hidden">
                              {competitors.map((competitor) => {
                                const competitorModuleFeature = competitorFeatureIndex
                                  .get(competitor.id)
                                  ?.get(makeCompetitorFeatureKey(moduleFeature.plan_id, moduleFeature.id));
                                const note = competitorModuleFeature?.note;
                                if (!note || !note.trim()) return null;
                                return (
                                  <div key={competitor.id} className="mt-2">
                                    <div className="text-[11px] font-semibold text-gray-700">
                                      {competitor.name}
                                    </div>
                                    <div className="text-xs text-gray-600 whitespace-normal">
                                      {note}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}></td>
                        {competitors.map((competitor) => {
                          const competitorModuleFeature = competitorFeatureIndex
                            .get(competitor.id)
                            ?.get(makeCompetitorFeatureKey(moduleFeature.plan_id, moduleFeature.id));
                          const note = competitorModuleFeature?.note;
                          
                          return (
                            <td key={competitor.id} className={`${TABLE_CELL_PADDING} pt-2 align-top ${TABLE_COL_WIDTH} text-center ${COMP_COL_BORDER}`}>
                              {note && (
                                <div className="hidden md:block text-xs text-gray-600 whitespace-normal text-center">
                                  {note}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}

                    {/* Features under this module - only show when module is open */}
                    {isModuleOpen && sortedFeatures.map((feature) => {
                      const isExpanded = expandedFeatures.has(feature.id);
                      const detailsRowId = `feature-details-${feature.id}`;
                      const hasContent = feature.content && feature.content.trim();
                      const hasAnyNotes = competitors.some(c => {
                        const cf = competitorFeatureIndex
                          .get(c.id)
                          ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                        return cf?.note && cf.note.trim();
                      });
                      const showExpandIcon = hasContent || hasAnyNotes;
                      
                      return (
                        <React.Fragment key={feature.id}>
                          <tr
                            className={
                              isExpanded
                                ? 'hover:bg-gray-50'
                                : 'border-b border-gray-100 hover:bg-gray-50'
                            }
                          >
                            <td className={`${TABLE_CELL_PADDING} text-xs sm:text-sm font-normal ${TABLE_FIRST_COL_WIDTH}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0 whitespace-normal pl-4 font-normal text-gray-700">
                                  {searchQuery ? highlightMatch(feature.name, searchQuery) : feature.name}
                                </div>
                                {showExpandIcon && (
                                  <button
                                    type="button"
                                    onClick={() => toggleFeatureExpansion(feature.id)}
                                    className="shrink-0 mt-0.5 p-1 text-gray-400 hover:text-(--primary) transition-colors focus-visible:outline-none"
                                    style={{ ['--primary' as any]: themeColors.cssVars.primary.base }}
                                    aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${feature.name}`}
                                    aria-expanded={isExpanded}
                                    aria-controls={detailsRowId}
                                  >
                                    {isExpanded ? <Minus className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                              {feature.description && (
                                <div className="text-xs text-gray-500 mt-1 pl-4">
                                  {searchQuery ? highlightMatch(feature.description, searchQuery) : feature.description}
                                </div>
                              )}
                            </td>
                            <td
                              className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}
                              style={{
                                backgroundColor: config.ui?.highlight_ours
                                  ? `color-mix(in srgb, ${themeColors.cssVars.primary.lighter} 12%, transparent)`
                                  : 'transparent',
                              }}
                            >
                              <StatusDot status="available" primaryColor={themeColors.cssVars.primary.base} />
                            </td>
                            {competitors.map((competitor) => {
                              const competitorFeature = competitorFeatureIndex
                                .get(competitor.id)
                                ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                              
                              const status = competitorFeature?.status || 'unknown';
                              const amount = competitorFeature?.amount;
                              const unit = competitorFeature?.unit || 'custom';
                              
                              // Format display based on unit
                              const formatAmount = () => {
                                if (!amount) return null;
                                if (unit === 'currency') {
                                  const numeric = Number(amount);
                                  if (Number.isNaN(numeric)) return amount;
                                  return formatMoney(numeric);
                                }
                                if (unit === 'custom') {
                                  return amount;
                                }
                                return `${amount} ${unit}`;
                              };
                              
                              return (
                                <td key={competitor.id} className={`${TABLE_CELL_PADDING} text-center ${TABLE_COL_WIDTH} ${COMP_COL_BORDER}`}>
                                  {(status === 'available' || status === 'partial' || status === 'unavailable' || status === 'unknown') && (
                                    <StatusDot status={status} primaryColor={themeColors.cssVars.primary.base} />
                                  )}
                                  {status === 'amount' && (
                                    <span
                                      className={`text-xs sm:text-sm text-gray-700 tabular-nums ${unit === 'currency' ? 'font-semibold' : 'font-medium'}`}
                                    >
                                      {formatAmount()}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Expanded row for feature description and all competitor notes */}
                          {isExpanded && (
                            <tr id={detailsRowId}>
                              <td className={`${TABLE_CELL_PADDING} pt-2 align-top border-b border-gray-200 ${TABLE_FIRST_COL_WIDTH}`}>
                                {hasContent && (
                                  <div className="text-xs text-gray-600 whitespace-normal">
                                    {feature.content}
                                  </div>
                                )}

                                {hasAnyNotes && (
                                  <div className="mt-3 md:hidden">
                                    {competitors.map((competitor) => {
                                      const competitorFeature = competitorFeatureIndex
                                        .get(competitor.id)
                                        ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                                      const note = competitorFeature?.note;
                                      if (!note || !note.trim()) return null;
                                      return (
                                        <div key={competitor.id} className="mt-2">
                                          <div className="text-[11px] font-semibold text-gray-700">
                                            {competitor.name}
                                          </div>
                                          <div className="text-xs text-gray-600 whitespace-normal">
                                            {note}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td className={`${TABLE_CELL_PADDING} pt-2 align-top border-b border-gray-200 ${TABLE_COL_WIDTH} ${OURS_COL_BORDER}`}></td>
                              {competitors.map((competitor) => {
                                const competitorFeature = competitorFeatureIndex
                                  .get(competitor.id)
                                  ?.get(makeCompetitorFeatureKey(feature.plan_id, feature.id));
                                const note = competitorFeature?.note;
                                
                                return (
                                  <td key={competitor.id} className={`${TABLE_CELL_PADDING} pt-2 align-top border-b border-gray-200 ${TABLE_COL_WIDTH} text-center ${COMP_COL_BORDER}`}>
                                    {note && (
                                      <div className="hidden md:block text-xs text-gray-600 whitespace-normal text-center">
                                        {note}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </React.Fragment>
        );
      })}
    </>
  );
}
