import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Zap,
  Cpu,
  HardDrive,
  ChevronRight,
  Filter,
  Pin,
} from 'lucide-react';
import {
  fetchCashifySummary,
  fetchCashifyVariants,
  fetchCashifyPriceAlerts,
  saveCashifyCustomUrl,
  testCashifyUrlApi,
  triggerCashifyScan,
  fetchModels,
  updateModel,
  bulkUpdateModels,
  CashifySummaryData,
  CashifyVariantItem,
  CashifyPriceAlertItem,
} from '../../../utils/api';
import { Model } from '../../../data/mockDatabase';
import { EditSpecsAndPricesModal } from './CatalogTab';

interface SeriesGroup {
  key: string;
  brandName: string;
  series: string;
  variants: CashifyVariantItem[];
  exactTargetCount: number;
  belowTargetCount: number;
  aboveTargetCount: number;
  hasPriceCount: number;
  needsFixCount: number;
}

interface SeriesAccordionCardProps {
  group: SeriesGroup;
  isSearchActive: boolean;
  isPinned: boolean;
  onTogglePin: (key: string) => void;
  onBulkFixSeries: (variants: CashifyVariantItem[], series: string) => void;
  isBulkFixing: boolean;
  fixingVariantKey: string | null;
  handleOpenEditSpecs: (variant: CashifyVariantItem) => void;
  handleApplyRecommendedPrice: (variant: CashifyVariantItem, price: number) => void;
  editingKey: string | null;
  editUrlValue: string;
  setEditUrlValue: (val: string) => void;
  handleSaveUrl: (key: string) => void;
  handleCancelEdit: () => void;
  handleStartEdit: (variant: CashifyVariantItem) => void;
  handleTestUrl: () => void;
  testingUrl: boolean;
  savingUrl: boolean;
  testResult: {
    ok: boolean;
    status: number;
    extractedPrice?: number | null;
    error?: string;
    is404?: boolean;
    isUnserviceable?: boolean;
  } | null;
}

/**
 * High-performance, isolated Series Accordion Card.
 * Manages its own local hover state so hovering does NOT re-render the other 79 series cards!
 * Uses hardware-accelerated CSS Grid transition for zero-lag 60fps/120fps expansion.
 */
const SeriesAccordionCard: React.FC<SeriesAccordionCardProps> = React.memo(({
  group,
  isSearchActive,
  isPinned,
  onTogglePin,
  onBulkFixSeries,
  isBulkFixing,
  fixingVariantKey,
  handleOpenEditSpecs,
  handleApplyRecommendedPrice,
  editingKey,
  editUrlValue,
  setEditUrlValue,
  handleSaveUrl,
  handleCancelEdit,
  handleStartEdit,
  handleTestUrl,
  testingUrl,
  savingUrl,
  testResult,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // 60ms hover intent prevents jitter when skimming mouse across the list
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 60);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // By default collapsed! Expands if hovered, if pinned by click, or if search is active.
  const isOpen = isSearchActive || isPinned || isHovered;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`bg-canvas-white border rounded-xl overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'border-cobalt/50 shadow-md ring-1 ring-cobalt/15'
          : 'border-ice-border shadow-2xs hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Series Accordion Header */}
      <div
        onClick={() => onTogglePin(group.key)}
        className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-ice-border/70 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1 rounded text-slate-500 hover:text-slate-900 transition-transform duration-200 ease-out ${
              isOpen ? 'rotate-90 text-cobalt' : 'rotate-0 text-slate-400'
            }`}
            title={isPinned ? 'Click to unpin' : 'Click to pin open'}
          >
            <ChevronRight className="w-4 h-4" />
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
            {group.brandName}
          </span>

          <h3 className="font-bold text-sm text-ink-navy tracking-tight">
            {group.series}
          </h3>

          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {group.variants.length} {group.variants.length === 1 ? 'Variant' : 'Variants'}
          </span>

          {/* Interactive Hover / Pin feedback indicator */}
          {isPinned ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
              <Pin className="w-2.5 h-2.5 fill-slate-500" />
              <span>Pinned Open</span>
            </span>
          ) : isHovered ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
              <span>Hover preview</span>
            </span>
          ) : null}
        </div>

        {/* Metric & Alignment Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {group.exactTargetCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{group.exactTargetCount} Exact +3%</span>
            </span>
          )}

          {group.belowTargetCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
              🚨 {group.belowTargetCount} Below Target
            </span>
          )}

          {group.aboveTargetCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
              📈 {group.aboveTargetCount} Above Target
            </span>
          )}

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Live Quotes: {group.hasPriceCount} / {group.variants.length}
          </span>

          {/* Series-Level 1-Click Fix Button */}
          {group.needsFixCount > 0 && (
            <button
              type="button"
              disabled={isBulkFixing || !!fixingVariantKey}
              onClick={(e) => {
                e.stopPropagation();
                onBulkFixSeries(group.variants, group.series);
              }}
              className="ml-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-md text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title={`Align all ${group.needsFixCount} variants in ${group.series} to exact +3% above Cashify`}
            >
              <Zap className="w-3 h-3 fill-current text-white" />
              <span>Fix Series ({group.needsFixCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Hardware-Accelerated CSS Grid Transition (Butter-smooth, 0ms reflow lag) */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-rows,opacity] ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-pure/70 border-b border-ice-border text-ink-muted uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Smartphone Model</th>
                  <th className="py-2.5 px-3">RAM</th>
                  <th className="py-2.5 px-3">Storage</th>
                  <th className="py-2.5 px-4">Rephonix Price</th>
                  <th className="py-2.5 px-4">Cashify Price</th>
                  <th className="py-2.5 px-4 min-w-[210px]">Margin Difference & Rec (+3%)</th>
                  <th className="py-2.5 px-4">Cashify Variant URL</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-border/60">
                {group.variants.map((variant) => {
                  const isEditing = editingKey === variant.variantKey;
                  const hasCashifyPrice = variant.cashifyPrice !== null;

                  return (
                    <tr key={variant.variantKey} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Model & Brand */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSpecs(variant)}
                          className="font-bold text-ink-navy hover:text-cobalt hover:underline text-sm leading-tight text-left cursor-pointer transition-colors block"
                          title="Click to edit specs & prices for this model"
                        >
                          {variant.modelName}
                        </button>
                        <div className="text-[11px] text-ink-muted font-mono mt-0.5">
                          {variant.brandName} • {variant.releaseYear}
                        </div>
                      </td>

                      {/* 2. RAM Variant */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {variant.ramGb > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <Cpu className="w-3 h-3 text-indigo-500" />
                            <span>{variant.ramLabel}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 3. Storage Variant */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          <span>{variant.storageLabel}</span>
                        </span>
                      </td>

                      {/* 4. Rephonix Buyback Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 group">
                          <span className="font-extrabold text-ink-navy text-sm">
                            ₹{variant.rephonixPrice.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSpecs(variant)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-cobalt hover:bg-cobalt/10 rounded transition-all cursor-pointer"
                            title="Edit Rephonix buyback prices for this model"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono">Our Buyback Payout</div>
                      </td>

                      {/* 5. Cashify Competitor Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasCashifyPrice ? (
                          <div>
                            <div className="font-extrabold text-indigo-700 text-sm font-mono">
                              ₹{variant.cashifyPrice!.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-indigo-500 font-mono">
                              {variant.lastAuditedDate
                                ? new Date(variant.lastAuditedDate).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Cashify Quote'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono italic">
                            <span>Pending scan</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Margin Difference & Recommended Price (+3% rule) */}
                      <td className="py-3 px-4">
                        {hasCashifyPrice ? (() => {
                          const cashifyP = variant.cashifyPrice!;
                          const recPrice = Math.round(cashifyP * 1.03);
                          const currentDiff = variant.difference ?? (variant.rephonixPrice - cashifyP);
                          const diffPct = ((variant.rephonixPrice - cashifyP) / cashifyP) * 100;
                          const isExact = variant.rephonixPrice === recPrice;
                          const isBelow = variant.rephonixPrice < recPrice;
                          const isFixing = fixingVariantKey === variant.variantKey;

                          return (
                            <div className="space-y-1.5 min-w-[200px]">
                              {/* Current Margin Diff Badge */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold inline-flex items-center gap-1 ${
                                    currentDiff > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : currentDiff < 0
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {currentDiff > 0
                                    ? `+₹${currentDiff.toLocaleString('en-IN')} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%)`
                                    : currentDiff < 0
                                    ? `-₹${Math.abs(currentDiff).toLocaleString('en-IN')} (${diffPct.toFixed(1)}%)`
                                    : `₹0 (0.0%)`}
                                </span>

                                {isExact ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100/90 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5 shadow-2xs">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>+3% Exact</span>
                                  </span>
                                ) : isBelow ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100/90 text-rose-800 border border-rose-300 inline-flex items-center gap-0.5 shadow-2xs">
                                    <span>Below +3%</span>
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100/90 text-indigo-800 border border-indigo-300 inline-flex items-center gap-0.5 shadow-2xs">
                                    <span>Above +3% ({diffPct > 3 ? `+${(diffPct - 3).toFixed(1)}%` : ''})</span>
                                  </span>
                                )}
                              </div>

                              {/* Recommended Price Box & 1-Click Fix Button */}
                              <div
                                className={`p-1.5 rounded-lg border text-xs ${
                                  isExact
                                    ? 'bg-emerald-50/40 border-emerald-100'
                                    : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  <span className="text-slate-500 font-medium font-sans">Target (Exact +3%):</span>
                                  <span className="font-extrabold font-mono text-indigo-950">
                                    ₹{recPrice.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {!isExact ? (
                                  <button
                                    type="button"
                                    disabled={isFixing || isBulkFixing}
                                    onClick={() => handleApplyRecommendedPrice(variant, recPrice)}
                                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-cobalt hover:from-indigo-700 hover:to-cobalt-hover active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                    title={`Fix Rephonix payout to exact +3% (₹${recPrice.toLocaleString('en-IN')})`}
                                  >
                                    {isFixing ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                        <span>Applying...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                                        <span>Fix to ₹{recPrice.toLocaleString('en-IN')}</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                                    <span className="flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Optimal Payout (Exact +3%)</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-slate-400 font-mono text-xs italic">— (Pending scan)</span>
                        )}
                      </td>

                      {/* 7. Cashify Variant URL */}
                      <td className="py-3 px-4 max-w-xs">
                        {isEditing ? (
                          <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-cobalt/40 shadow-xs">
                            <input
                              type="url"
                              value={editUrlValue}
                              onChange={(e) => setEditUrlValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveUrl(variant.variantKey);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              placeholder="https://www.cashify.in/sell-old-mobile-phone/used-..."
                              className="w-full px-2.5 py-1.5 text-xs border border-cobalt bg-white rounded focus:outline-none font-mono"
                              autoFocus
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveUrl(variant.variantKey)}
                                disabled={savingUrl}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold font-mono cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                                title="Press Enter or Click to Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{savingUrl ? 'Saving...' : 'Save URL'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleTestUrl}
                                disabled={testingUrl}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors"
                              >
                                {testingUrl ? 'Testing...' : 'Test URL'}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-mono cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                              {testResult && (
                                <div className="w-full mt-1 flex flex-col gap-1">
                                  <span
                                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 max-w-full ${
                                      testResult.ok
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : testResult.is404
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : testResult.isUnserviceable
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}
                                  >
                                    {testResult.ok ? (
                                      <>
                                        <span>✓ Verified</span>
                                        {testResult.extractedPrice ? (
                                          <span className="font-extrabold text-emerald-950">
                                            (Live: ₹{testResult.extractedPrice.toLocaleString('en-IN')})
                                          </span>
                                        ) : null}
                                      </>
                                    ) : testResult.is404 ? (
                                      <span>✗ 404: Page Not Found on Cashify</span>
                                    ) : testResult.isUnserviceable ? (
                                      <span>⚠️ Cashify not purchasing in this location (Gurgaon / Delhi / etc.)</span>
                                    ) : (
                                      <span>✗ {testResult.error || `HTTP ${testResult.status} Error`}</span>
                                    )}
                                  </span>
                                  {!testResult.ok && testResult.error && !testResult.is404 && !testResult.isUnserviceable && (
                                    <span className="text-[10px] text-rose-600 font-sans leading-tight">
                                      {testResult.error}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Tip: Press <b>Enter</b> to save or <b>Esc</b> to cancel
                            </span>
                          </div>
                        ) : variant.cashifyUrl ? (
                          <div className="flex items-center gap-1.5 group">
                            <a
                              href={variant.cashifyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[11px] text-cobalt hover:underline truncate max-w-[200px] inline-block"
                              title={variant.cashifyUrl}
                            >
                              {variant.cashifyUrl.replace('https://www.cashify.in/sell-old-mobile-phone/', '')}
                            </a>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cobalt shrink-0" />
                          </div>
                        ) : (
                          <span className="text-amber-600 font-mono text-[11px]">No URL mapped</span>
                        )}
                      </td>

                      {/* 8. URL Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {variant.isCustomOverride ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            ⭐ Custom Override
                          </span>
                        ) : variant.urlStatus === 'FOUND' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> 200 OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Missing (404)
                          </span>
                        )}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveUrl(variant.variantKey)}
                              disabled={savingUrl}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                              title="Save Custom URL for this Variant"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all"
                              title="Cancel Edit"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditSpecs(variant)}
                              className="px-2.5 py-1 text-xs bg-cobalt/10 hover:bg-cobalt/20 text-cobalt border border-cobalt/20 hover:border-cobalt/40 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Edit specs, RAM/Storage matrix and Rephonix buyback prices"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Specs & Prices</span>
                            </button>

                            <button
                              onClick={() => handleStartEdit(variant)}
                              className="px-2.5 py-1 text-xs border border-ice-border hover:border-slate-400 hover:bg-slate-50 text-ink-slate rounded font-medium transition-all cursor-pointer flex items-center gap-1.5"
                              title="Edit specific Cashify URL for this RAM/Storage variant"
                            >
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                              <span>{variant.cashifyUrl ? 'Edit URL' : 'Set URL'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export const CashifyMonitorTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'variants' | 'alerts'>('variants');
  const [summary, setSummary] = useState<CashifySummaryData | null>(null);
  const [variants, setVariants] = useState<CashifyVariantItem[]>([]);
  const [alerts, setAlerts] = useState<CashifyPriceAlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Brand, Series & Spec Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
  const [selectedRam, setSelectedRam] = useState<string>('ALL');
  const [selectedStorage, setSelectedStorage] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Series pin states (by default collapsed!)
  const [pinnedSeries, setPinnedSeries] = useState<Record<string, boolean>>({});

  // Inline editing state for specific variant row
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState<string>('');
  const [testingUrl, setTestingUrl] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status: number;
    extractedPrice?: number | null;
    error?: string;
    is404?: boolean;
    isUnserviceable?: boolean;
  } | null>(null);
  const [savingUrl, setSavingUrl] = useState<boolean>(false);

  // Recommended price fixing states
  const [fixingVariantKey, setFixingVariantKey] = useState<string | null>(null);
  const [isBulkFixing, setIsBulkFixing] = useState<boolean>(false);

  // Specs & Prices Edit Modal state
  const [models, setModels] = useState<Model[]>([]);
  const [editingModelForSpecs, setEditingModelForSpecs] = useState<Model | null>(null);
  const [highlightSpecVariant, setHighlightSpecVariant] = useState<{ ram: number; storage: number } | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, variantsRes, alertsRes, modelsRes] = await Promise.all([
        fetchCashifySummary().catch(() => null),
        fetchCashifyVariants().catch(() => []),
        fetchCashifyPriceAlerts().catch(() => []),
        fetchModels(undefined, undefined, true).catch(() => []),
      ]);
      if (sumRes) {
        setSummary(sumRes);
        setIsScanning(!!sumRes.isScanRunning);
      }
      setVariants(variantsRes);
      setAlerts(alertsRes);
      if (modelsRes && Array.isArray(modelsRes)) {
        setModels(modelsRes as Model[]);
      }
    } catch (err) {
      console.error('Failed to load Cashify monitor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const findTargetModel = (variant: CashifyVariantItem, modelList: Model[]): Model | undefined => {
    const direct = modelList.find(
      (m) =>
        (m as any).dbId === variant.modelId ||
        m.id === variant.modelId ||
        (m as any).legacyId === variant.modelId ||
        (variant.legacyId && (
          m.id === variant.legacyId ||
          (m as any).legacyId === variant.legacyId ||
          (m as any).dbId === variant.legacyId
        ))
    );
    if (direct) return direct;

    const activeByName = modelList.find(
      (m) =>
        !m.hidden &&
        m.name.trim().toLowerCase() === variant.modelName.trim().toLowerCase()
    );
    if (activeByName) return activeByName;

    return modelList.find(
      (m) => m.name.trim().toLowerCase() === variant.modelName.trim().toLowerCase()
    );
  };

  const handleOpenEditSpecs = useCallback(async (variant: CashifyVariantItem) => {
    let target = findTargetModel(variant, models);

    if (!target) {
      try {
        const freshModels = await fetchModels(undefined, undefined, true);
        if (freshModels && Array.isArray(freshModels)) {
          setModels(freshModels as Model[]);
          target = findTargetModel(variant, freshModels as Model[]);
        }
      } catch (err) {
        console.error('Failed to fetch models for specs edit:', err);
      }
    }

    if (!target) {
      target = {
        id: variant.legacyId || variant.modelId,
        legacyId: variant.legacyId || variant.modelId,
        brandId: variant.brandId || 'brand-apple',
        name: variant.modelName,
        category: 'premium',
        releaseYear: variant.releaseYear || new Date().getFullYear(),
        basePrice128GB: variant.rephonixPrice || 30000,
        supportedStorageGb: [variant.storageGb || 128],
        supportedRamGb: [variant.ramGb || 0],
        variantPrices: { [`${variant.ramGb}_${variant.storageGb}`]: variant.rephonixPrice },
      } as Model;
    }

    setHighlightSpecVariant({ ram: variant.ramGb, storage: variant.storageGb });
    setEditingModelForSpecs(target);
  }, [models]);

  const handleSpecsSaveSuccess = useCallback(async () => {
    setSuccessNotification('Model specs & prices updated successfully in database!');
    await loadData();
    window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
  }, [loadData]);

  const handleApplyRecommendedPrice = useCallback(async (variant: CashifyVariantItem, recommendedPrice: number) => {
    if (fixingVariantKey || isBulkFixing) return;
    setFixingVariantKey(variant.variantKey);
    try {
      let target = findTargetModel(variant, models);

      if (!target) {
        const freshModels = await fetchModels(undefined, undefined, true);
        if (freshModels && Array.isArray(freshModels)) {
          setModels(freshModels as Model[]);
          target = findTargetModel(variant, freshModels as Model[]);
        }
      }

      const legacyId = (target as any)?.legacyId || target?.id || variant.legacyId || variant.modelId;
      const key = `${variant.ramGb}_${variant.storageGb}`;
      const currentVariantPrices = target?.variantPrices ? { ...target.variantPrices } : {};
      currentVariantPrices[key] = recommendedPrice;

      const activePrices = Object.values(currentVariantPrices).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : recommendedPrice;

      await updateModel(legacyId, {
        variantPrices: currentVariantPrices,
        basePrice128GB: minPrice,
      });

      setVariants((prev) =>
        prev.map((v) => {
          if (v.variantKey === variant.variantKey) {
            const newDiff = recommendedPrice - (v.cashifyPrice || 0);
            return {
              ...v,
              rephonixPrice: recommendedPrice,
              difference: newDiff,
            };
          }
          return v;
        })
      );

      setModels((prev) =>
        prev.map((m) => {
          if (
            m.id === legacyId ||
            (m as any).legacyId === legacyId ||
            (m as any).dbId === legacyId ||
            (target && m.id === target.id)
          ) {
            return {
              ...m,
              variantPrices: currentVariantPrices,
              basePrice128GB: minPrice,
            };
          }
          return m;
        })
      );

      setSuccessNotification(
        `✓ Updated ${variant.modelName} (${variant.specLabel}) buyback payout to ₹${recommendedPrice.toLocaleString('en-IN')} (+3% above Cashify)!`
      );
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    } catch (err: any) {
      console.error('Failed to update recommended price:', err);
      alert('Failed to update price: ' + (err.message || err));
    } finally {
      setFixingVariantKey(null);
    }
  }, [fixingVariantKey, isBulkFixing, models]);

  const handleBulkFixVariants = useCallback(async (variantsToFix: CashifyVariantItem[], groupLabel?: string) => {
    if (isBulkFixing || fixingVariantKey) return;

    const targets = variantsToFix.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice !== Math.round(v.cashifyPrice * 1.03)
    );

    if (targets.length === 0) {
      alert(groupLabel
        ? `All visible variants in ${groupLabel} are already aligned to exact +3% above Cashify!`
        : 'All targeted variants are already aligned to exact +3% above Cashify!'
      );
      return;
    }

    const belowCount = targets.filter((v) => v.rephonixPrice < Math.round(v.cashifyPrice! * 1.03)).length;
    const aboveCount = targets.filter((v) => v.rephonixPrice > Math.round(v.cashifyPrice! * 1.03)).length;

    const confirm = window.confirm(
      `Fix prices to exact +3% above Cashify for ${targets.length} variants${groupLabel ? ` in ${groupLabel}` : ''}?\n` +
      (belowCount > 0 ? `\n• ${belowCount} below target (will increase to +3%)` : '') +
      (aboveCount > 0 ? `\n• ${aboveCount} above target (will adjust to exact +3%)` : '') +
      `\n\nThis will update buyback prices directly in the database.`
    );
    if (!confirm) return;

    setIsBulkFixing(true);
    try {
      const modelUpdatesMap = new Map<string, Record<string, number>>();

      targets.forEach((v) => {
        const existingTarget = findTargetModel(v, models);
        const resolvedLegacyId =
          (existingTarget as any)?.legacyId ||
          existingTarget?.id ||
          v.legacyId ||
          v.modelId;

        const key = `${v.ramGb}_${v.storageGb}`;
        const recPrice = Math.round(v.cashifyPrice! * 1.03);

        const currentPrices =
          modelUpdatesMap.get(resolvedLegacyId) ||
          (existingTarget?.variantPrices ? { ...existingTarget.variantPrices } : {});

        currentPrices[key] = recPrice;
        modelUpdatesMap.set(resolvedLegacyId, currentPrices);
      });

      const updatesPayload = Array.from(modelUpdatesMap.entries()).map(([id, prices]) => {
        const activePrices = Object.values(prices).filter((p): p is number => typeof p === 'number' && p > 0);
        const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 30000;
        return {
          id,
          changes: {
            variantPrices: prices,
            basePrice128GB: minPrice,
          },
        };
      });

      await bulkUpdateModels(updatesPayload);

      setSuccessNotification(
        `✓ Successfully aligned ${targets.length} variants across ${modelUpdatesMap.size} models${groupLabel ? ` in ${groupLabel}` : ''} to exact +3% above Cashify!`
      );
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
      await loadData();
    } catch (err: any) {
      console.error('Failed bulk price update:', err);
      alert('Failed bulk price update: ' + (err.message || err));
    } finally {
      setIsBulkFixing(false);
    }
  }, [fixingVariantKey, isBulkFixing, loadData, models]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const brandsList = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.brandName));
    return Array.from(set).sort();
  }, [variants]);

  const brandStats = useMemo(() => {
    const stats: Record<string, { total: number; seriesSet: Set<string> }> = {};
    variants.forEach((v) => {
      if (!stats[v.brandName]) {
        stats[v.brandName] = { total: 0, seriesSet: new Set() };
      }
      stats[v.brandName].total++;
      if (v.series) stats[v.brandName].seriesSet.add(v.series);
    });
    return stats;
  }, [variants]);

  const totalSeriesCount = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      if (v.series) set.add(v.series);
    });
    return set.size;
  }, [variants]);

  const seriesList = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      if (selectedBrand === 'ALL' || v.brandName === selectedBrand) {
        if (v.series) set.add(v.series);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [variants, selectedBrand]);

  const ramList = useMemo(() => {
    const set = new Set<number>();
    variants.forEach((v) => {
      if (v.ramGb > 0) set.add(v.ramGb);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [variants]);

  const storageList = useMemo(() => {
    const set = new Set<number>();
    variants.forEach((v) => set.add(v.storageGb));
    return Array.from(set).sort((a, b) => a - b);
  }, [variants]);

  const notExactTargetTotalCount = useMemo(() => {
    return variants.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice !== Math.round(v.cashifyPrice * 1.03)
    ).length;
  }, [variants]);

  const belowTargetTotalCount = useMemo(() => {
    return variants.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice < Math.round(v.cashifyPrice * 1.03)
    ).length;
  }, [variants]);

  const aboveTargetTotalCount = useMemo(() => {
    return variants.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice > Math.round(v.cashifyPrice * 1.03)
    ).length;
  }, [variants]);

  const editingModelCashifyPrices = useMemo(() => {
    if (!editingModelForSpecs) return undefined;
    const map: Record<string, number> = {};
    variants.forEach((v) => {
      if (
        (v.modelId === editingModelForSpecs.id ||
          v.modelId === (editingModelForSpecs as any).legacyId ||
          v.modelId === (editingModelForSpecs as any).dbId ||
          (v.legacyId && (v.legacyId === editingModelForSpecs.id || v.legacyId === (editingModelForSpecs as any).legacyId)) ||
          v.modelName.toLowerCase() === editingModelForSpecs.name.toLowerCase()) &&
        v.cashifyPrice !== null &&
        v.cashifyPrice > 0
      ) {
        map[`${v.ramGb}_${v.storageGb}`] = v.cashifyPrice;
      }
    });
    return Object.keys(map).length > 0 ? map : undefined;
  }, [editingModelForSpecs, variants]);

  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedSeries('ALL');
  };

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      if (selectedBrand !== 'ALL' && v.brandName !== selectedBrand) return false;
      if (selectedSeries !== 'ALL' && (v.series || 'Standard') !== selectedSeries) return false;

      if (selectedRam !== 'ALL') {
        if (selectedRam === 'NONE' && v.ramGb !== 0) return false;
        if (selectedRam !== 'NONE' && v.ramGb !== parseInt(selectedRam, 10)) return false;
      }
      if (selectedStorage !== 'ALL' && v.storageGb !== parseInt(selectedStorage, 10)) return false;

      if (statusFilter === 'VERIFIED' && v.urlStatus !== 'FOUND') return false;
      if (statusFilter === 'MISSING' && v.urlStatus !== 'MISSING') return false;
      if (statusFilter === 'OVERRIDDEN' && !v.isCustomOverride) return false;
      if (statusFilter === 'HAS_PRICE' && v.cashifyPrice === null) return false;
      if (statusFilter === 'PENDING' && v.cashifyPrice !== null) return false;
      if (statusFilter === 'NOT_EXACT_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice === rec) return false;
      }
      if (statusFilter === 'BELOW_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice >= rec) return false;
      }
      if (statusFilter === 'ABOVE_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice <= rec) return false;
      }
      if (statusFilter === 'EXACT_TARGET' || statusFilter === 'MEETS_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice !== rec) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          v.modelName.toLowerCase().includes(q) ||
          (v.series && v.series.toLowerCase().includes(q)) ||
          v.brandName.toLowerCase().includes(q) ||
          v.ramLabel.toLowerCase().includes(q) ||
          v.storageLabel.toLowerCase().includes(q) ||
          v.specLabel.toLowerCase().includes(q) ||
          (v.cashifyUrl && v.cashifyUrl.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [variants, selectedBrand, selectedSeries, selectedRam, selectedStorage, statusFilter, searchQuery]);

  const groupedSeries = useMemo(() => {
    const map = new Map<string, SeriesGroup>();

    filteredVariants.forEach((v) => {
      const sName = v.series || 'Standard';
      const groupKey = `${v.brandName}___${sName}`;

      let group = map.get(groupKey);
      if (!group) {
        group = {
          key: groupKey,
          brandName: v.brandName,
          series: sName,
          variants: [],
          exactTargetCount: 0,
          belowTargetCount: 0,
          aboveTargetCount: 0,
          hasPriceCount: 0,
          needsFixCount: 0,
        };
        map.set(groupKey, group);
      }

      group.variants.push(v);
      if (v.cashifyPrice !== null && v.cashifyPrice > 0) {
        group.hasPriceCount++;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice === rec) {
          group.exactTargetCount++;
        } else {
          group.needsFixCount++;
          if (v.rephonixPrice < rec) {
            group.belowTargetCount++;
          } else {
            group.aboveTargetCount++;
          }
        }
      }
    });

    return Array.from(map.values());
  }, [filteredVariants]);

  // Series Pin & Collapse actions (By default collapsed!)
  const handleTogglePinSeries = useCallback((key: string) => {
    setPinnedSeries((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    groupedSeries.forEach((g) => {
      next[g.key] = true;
    });
    setPinnedSeries(next);
  }, [groupedSeries]);

  const handleCollapseAll = useCallback(() => {
    setPinnedSeries({});
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedBrand !== 'ALL' && a.brandName !== selectedBrand) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          a.modelName.toLowerCase().includes(q) ||
          a.brandName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, selectedBrand, statusFilter, searchQuery]);

  const handleStartEdit = useCallback((variant: CashifyVariantItem) => {
    setEditingKey(variant.variantKey);
    setEditUrlValue(variant.cashifyUrl || '');
    setTestResult(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditUrlValue('');
    setTestResult(null);
  }, []);

  const handleTestUrl = useCallback(async () => {
    if (!editUrlValue.trim()) return;
    setTestingUrl(true);
    setTestResult(null);
    try {
      const res = await testCashifyUrlApi(editUrlValue.trim());
      setTestResult({
        ok: res.ok,
        status: res.status,
        extractedPrice: res.extractedPrice,
        error: res.error,
        is404: res.is404,
        isUnserviceable: res.isUnserviceable,
      });
    } catch (err: any) {
      setTestResult({ ok: false, status: 0, error: err.message || 'Connection failed' });
    } finally {
      setTestingUrl(false);
    }
  }, [editUrlValue]);

  const handleSaveUrl = useCallback(async (key: string) => {
    let cleanUrl = editUrlValue.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://www.cashify.in/sell-old-mobile-phone/${cleanUrl.replace(/^\/+/, '')}`;
    }
    setSavingUrl(true);
    try {
      await saveCashifyCustomUrl(key, cleanUrl);
      setEditingKey(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to save custom Cashify URL: ' + (err.message || err));
    } finally {
      setSavingUrl(false);
    }
  }, [editUrlValue, loadData]);

  const handleTriggerScan = async (limit: number = 0) => {
    if (isScanning) return;
    const confirm = window.confirm(
      `Start background Cashify price comparison for ${limit === 0 ? 'all active models & variants' : `${limit} models`}?\n\nThis will crawl Cashify with your authenticated Brave session.`
    );
    if (!confirm) return;

    try {
      setIsScanning(true);
      setScanMessage('Initiating background price crawler...');
      const res = await triggerCashifyScan(limit);
      setScanMessage(res.message);
      setTimeout(() => setScanMessage(''), 8000);
    } catch (err: any) {
      alert('Failed to trigger price scan: ' + (err.message || err));
      setIsScanning(false);
    }
  };

  if (loading && variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
        <RefreshCw className="w-8 h-8 animate-spin text-cobalt mb-3" />
        <p className="font-semibold text-sm">Loading Cashify Market Intelligence Catalog...</p>
        <p className="text-xs text-ink-muted mt-1">Organizing Brand & Series pricing matrix</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Compact Header & Command Strip ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">Cashify Market Intelligence</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {variants.length} Variants
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {totalSeriesCount} Series
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-mono">
              Brand & Series-organized competitor parity tracking per RAM & Storage specification
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Session Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border ${
              summary?.session.hasSession
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
            title={
              summary?.session.hasSession
                ? `Authenticated session loaded (${summary.session.cookiesCount} cookies)`
                : 'No session file found at server/data/cashify_session.json'
            }
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{summary?.session.hasSession ? 'Brave Active' : 'No Session'}</span>
          </div>

          <button
            onClick={() => handleTriggerScan(10)}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Crawl top 10 models quickly to test"
          >
            <Play className="w-3 h-3 text-indigo-400" />
            <span>Audit Top 10</span>
          </button>

          <button
            onClick={() => handleTriggerScan(0)}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Start full background audit of all models"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Run Full Audit'}</span>
          </button>
        </div>
      </div>

      {/* Background scan notification banner */}
      {scanMessage && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>{scanMessage}</span>
          </div>
          <span className="font-mono text-[11px] text-indigo-600">Background Worker Active</span>
        </div>
      )}

      {/* ── Compact Metric Stat Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-canvas-white border border-ice-border rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-ink-muted block">Catalog Matrix</span>
            <span className="text-lg font-extrabold text-ink-navy">{variants.length} Variants</span>
            <span className="text-[10px] text-ink-muted block font-mono">
              {brandsList.length} Brands • {totalSeriesCount} Series
            </span>
          </div>
          <Layers className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-700 block">Verified Endpoints</span>
            <span className="text-lg font-extrabold text-emerald-600">
              {variants.filter((v) => v.urlStatus === 'FOUND' || v.urlStatus === 'OVERRIDDEN').length}
              <span className="text-xs font-normal text-emerald-700 ml-1 font-mono">
                ({variants.length > 0 ? ((variants.filter((v) => v.urlStatus === 'FOUND' || v.urlStatus === 'OVERRIDDEN').length / variants.length) * 100).toFixed(0) : 0}%)
              </span>
            </span>
            <span className="text-[10px] text-emerald-600/80 block font-mono">200 OK Live</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-blue-700 block">Competitor Drops (▼)</span>
            <span className="text-lg font-extrabold text-blue-600">{summary?.priceAlertsStats?.decreased ?? 0}</span>
            <span className="text-[10px] text-blue-600/80 block font-mono">Cashify Reduced Price</span>
          </div>
          <TrendingDown className="w-5 h-5 text-blue-500" />
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-lg p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-rose-700 block">Competitor Hikes (▲)</span>
            <span className="text-lg font-extrabold text-rose-600">{summary?.priceAlertsStats?.increased ?? 0}</span>
            <span className="text-[10px] text-rose-600/80 block font-mono">Cashify Raised Price</span>
          </div>
          <TrendingUp className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      {/* ── Sub Navigation Tabs Bar ── */}
      <div className="flex items-center justify-between border-b border-ice-border pb-3">
        <div className="flex items-center gap-2 bg-canvas-pure p-1 rounded-xl border border-ice-border shadow-xs">
          <button
            onClick={() => {
              setActiveSubTab('variants');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'variants'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Brand & Series Matrix</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {variants.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('alerts');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Price Shifts & Alerts Log</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {alerts.length}
            </span>
          </button>
        </div>

        {/* Global Auto-Fix All to +3% Target Button */}
        {activeSubTab === 'variants' && notExactTargetTotalCount > 0 && (
          <button
            type="button"
            onClick={() => handleBulkFixVariants(filteredVariants)}
            disabled={isBulkFixing || !!fixingVariantKey}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title={`Automatically align all ${notExactTargetTotalCount} variants to exact +3% above Cashify (${belowTargetTotalCount} below, ${aboveTargetTotalCount} above)`}
          >
            {isBulkFixing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
            )}
            <span>Auto-Fix All to +3% ({notExactTargetTotalCount})</span>
          </button>
        )}
      </div>

      {/* ── Brand Selection Quick Switcher Bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => handleSelectBrand('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedBrand === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs font-extrabold'
              : 'bg-canvas-white hover:bg-slate-100 text-ink-slate border border-ice-border'
          }`}
        >
          <span>All Brands</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedBrand === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {variants.length}
          </span>
        </button>

        {brandsList.map((brand) => {
          const isSelected = selectedBrand === brand;
          const stats = brandStats[brand] || { total: 0, seriesSet: new Set() };
          return (
            <button
              key={brand}
              type="button"
              onClick={() => handleSelectBrand(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cobalt text-white shadow-xs font-extrabold'
                  : 'bg-canvas-white hover:bg-slate-100 text-ink-slate border border-ice-border'
              }`}
            >
              <span>{brand}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar & Filter Controls Card ── */}
      <div className="bg-canvas-white border border-ice-border rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Prominent Search Option */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search model, series, brand, RAM, storage, or URL... (e.g. iPhone 17, 12 GB, Fold, 512 GB)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-ice-border focus:border-cobalt rounded-lg text-ink-navy placeholder:text-slate-400 focus:outline-none transition-colors shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Summary & Accordion Toggles */}
          {activeSubTab === 'variants' && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <span className="text-xs font-mono font-semibold text-slate-500 whitespace-nowrap">
                {filteredVariants.length} variants in {groupedSeries.length} series
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-ink-navy hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Lock and pin all series open"
              >
                Pin All Open
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/60 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Collapse all into default hover-peek mode"
              >
                <Zap className="w-3 h-3 text-indigo-500 fill-indigo-400" />
                <span>Hover-Peek Mode</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase font-mono mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => handleSelectBrand(e.target.value)}
            className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
          >
            <option value="ALL">All Brands ({brandsList.length})</option>
            {brandsList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Series Filter */}
          {activeSubTab === 'variants' && (
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer max-w-[220px] truncate"
            >
              <option value="ALL">All Series ({seriesList.length})</option>
              {seriesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* RAM Filter */}
          {activeSubTab === 'variants' && (
            <select
              value={selectedRam}
              onChange={(e) => setSelectedRam(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All RAMs</option>
              {ramList.map((r) => (
                <option key={r} value={r}>
                  {r} GB RAM
                </option>
              ))}
              <option value="NONE">Fixed / Apple (—)</option>
            </select>
          )}

          {/* Storage Filter */}
          {activeSubTab === 'variants' && (
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Storages</option>
              {storageList.map((s) => (
                <option key={s} value={s}>
                  {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {activeSubTab === 'variants' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_EXACT_TARGET">⚠️ Needs Alignment to +3% ({notExactTargetTotalCount})</option>
              <option value="BELOW_TARGET">🚨 Below +3% Target ({belowTargetTotalCount})</option>
              <option value="ABOVE_TARGET">📈 Above +3% Target ({aboveTargetTotalCount})</option>
              <option value="EXACT_TARGET">🎯 Exact +3% Target</option>
              <option value="VERIFIED">✅ Verified URL</option>
              <option value="MISSING">⚠️ Missing URL</option>
              <option value="OVERRIDDEN">⭐ Custom Overridden</option>
              <option value="HAS_PRICE">💰 Has Cashify Price</option>
              <option value="PENDING">⏳ Pending Scan</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Price Trends</option>
              <option value="INCREASED">▲ Increased by Cashify</option>
              <option value="DECREASED">▼ Decreased by Cashify</option>
              <option value="STABLE">━ Stable Market Price</option>
            </select>
          )}

          {/* Reset Filters button if any non-default is active */}
          {(selectedBrand !== 'ALL' || selectedSeries !== 'ALL' || selectedRam !== 'ALL' || selectedStorage !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('ALL');
                setSelectedSeries('ALL');
                setSelectedRam('ALL');
                setSelectedStorage('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successNotification}</span>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── View 1: Brand & Series Grouped Variant Price Matrix ── */}
      {activeSubTab === 'variants' && (
        <div className="space-y-4">
          {filteredVariants.length === 0 ? (
            <div className="bg-canvas-white border border-ice-border rounded-xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-ink-navy text-sm">No matching variants found</h3>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No variants found matching "${searchQuery}". Try searching for another model, series, or spec.`
                  : 'No variants match the current combination of brand, series, RAM, storage, or status filters.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBrand('ALL');
                  setSelectedSeries('ALL');
                  setSelectedRam('ALL');
                  setSelectedStorage('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cobalt hover:bg-cobalt-hover text-white transition-all cursor-pointer shadow-xs"
              >
                Clear All Filters & Search
              </button>
            </div>
          ) : (
            groupedSeries.map((group) => (
              <SeriesAccordionCard
                key={group.key}
                group={group}
                isSearchActive={Boolean(searchQuery.trim())}
                isPinned={Boolean(pinnedSeries[group.key])}
                onTogglePin={handleTogglePinSeries}
                onBulkFixSeries={handleBulkFixVariants}
                isBulkFixing={isBulkFixing}
                fixingVariantKey={fixingVariantKey}
                handleOpenEditSpecs={handleOpenEditSpecs}
                handleApplyRecommendedPrice={handleApplyRecommendedPrice}
                editingKey={editingKey}
                editUrlValue={editUrlValue}
                setEditUrlValue={setEditUrlValue}
                handleSaveUrl={handleSaveUrl}
                handleCancelEdit={handleCancelEdit}
                handleStartEdit={handleStartEdit}
                handleTestUrl={handleTestUrl}
                testingUrl={testingUrl}
                savingUrl={savingUrl}
                testResult={testResult}
              />
            ))
          )}
        </div>
      )}

      {/* ── View 2: Price Shifts & Alerts Log Tab ── */}
      {activeSubTab === 'alerts' && (
        <div className="bg-canvas-white border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-pure border-b border-ice-border text-ink-muted uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Smartphone Model</th>
                  <th className="py-3 px-4">Variant Spec</th>
                  <th className="py-3 px-4">Rephonix Payout</th>
                  <th className="py-3 px-4">Cashify Competitor Price</th>
                  <th className="py-3 px-4">Margin Difference</th>
                  <th className="py-3 px-4">Competitor Shift</th>
                  <th className="py-3 px-4">Audited Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-border/60">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-muted">
                      No price comparison alerts recorded yet. Click &quot;Audit Top 10&quot; or &quot;Run Full Audit&quot; to crawl live Cashify quotes!
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isPayingMore = alert.difference > 0;

                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Model */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ink-navy text-sm">{alert.modelName}</div>
                          <div className="text-[11px] text-ink-muted font-mono">{alert.brandName}</div>
                        </td>

                        {/* Variant */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold text-slate-700 border border-slate-200">
                            {alert.ramGb > 0 ? `${alert.ramGb}GB / ` : ''}
                            {alert.storageGb >= 1024 ? `${alert.storageGb / 1024}TB` : `${alert.storageGb}GB`}
                          </span>
                        </td>

                        {/* Rephonix Price */}
                        <td className="py-3.5 px-4 font-bold text-ink-navy text-sm">
                          ₹{alert.rephonixPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Cashify Price */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700 text-sm">
                          ₹{alert.cashifyPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Difference / Edge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                              isPayingMore
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPayingMore
                              ? `+₹${alert.difference.toLocaleString('en-IN')} (We pay more)`
                              : `-₹${Math.abs(alert.difference).toLocaleString('en-IN')} (We pay less)`}
                          </span>
                        </td>

                        {/* Status / Shift */}
                        <td className="py-3.5 px-4">
                          {alert.status === 'INCREASED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                              <TrendingUp className="w-3 h-3" /> ▲ +₹{alert.changeAmount.toLocaleString('en-IN')}
                            </span>
                          ) : alert.status === 'DECREASED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-max">
                              <TrendingDown className="w-3 h-3" /> ▼ -₹{Math.abs(alert.changeAmount).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-max">
                              <Minus className="w-3 h-3" /> Stable
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-ink-muted font-mono text-[11px] whitespace-nowrap">
                          {new Date(alert.alertDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Specs & Prices Modal (Reused directly from CatalogTab) */}
      {editingModelForSpecs && (
        <EditSpecsAndPricesModal
          isOpen={Boolean(editingModelForSpecs)}
          model={editingModelForSpecs}
          highlightVariant={highlightSpecVariant}
          cashifyPrices={editingModelCashifyPrices}
          onClose={() => {
            setEditingModelForSpecs(null);
            setHighlightSpecVariant(null);
          }}
          onSaveSuccess={handleSpecsSaveSuccess}
        />
      )}
    </div>
  );
};

export default CashifyMonitorTab;
