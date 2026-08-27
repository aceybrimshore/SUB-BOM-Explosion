import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Layers,
  GitFork,
  CheckCircle2,
  Table as TableIcon,
  Columns,
  Copy,
  Check,
  Eye,
  X,
  FileText,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import { ExplodedRow, BuildScheduleRecord } from '../types/bom';
import { exportTableToCSV } from '../utils/exporter';

interface ParentBreakdownTableProps {
  explodedRows: ExplodedRow[];
  buildSchedule?: BuildScheduleRecord[];
  onUpdateSchedule?: (schedule: BuildScheduleRecord[]) => void;
  qtyOverrides?: Record<string, number>;
  onUpdateQtyOverride?: (key: string, qty: number) => void;
  deletedRowKeys?: string[];
  onDeleteRowKey?: (key: string) => void;
  onResetCustomizations?: () => void;
}

type SortField = 'component' | 'totalRequired' | 'parent' | 'level' | 'available' | 'raiseQty';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'ITEM_QTY_ONLY' | 'PARENT_ITEM_LEVEL' | 'DETAILED_AUDIT';
type ScopeMode = 'PASTED_ONLY' | 'ALL_BOM';
type ConsolidationMode = 'EXPLODED' | 'CONSOLIDATED';
type StockFilterMode = 'ALL' | 'RAISE_ONLY' | 'IN_STOCK_ONLY';

export const ParentBreakdownTable: React.FC<ParentBreakdownTableProps> = ({
  explodedRows,
  buildSchedule = [],
  onUpdateSchedule,
  qtyOverrides = {},
  onUpdateQtyOverride,
  deletedRowKeys = [],
  onDeleteRowKey,
  onResetCustomizations,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('ITEM_QTY_ONLY');
  const [scopeMode, setScopeMode] = useState<ScopeMode>(buildSchedule.length > 0 ? 'PASTED_ONLY' : 'ALL_BOM');
  const [consolidation, setConsolidation] = useState<ConsolidationMode>('CONSOLIDATED');
  const [stockFilter, setStockFilter] = useState<StockFilterMode>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('component');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [copyModalData, setCopyModalData] = useState<{ open: boolean; text: string; count: number }>({
    open: false,
    text: '',
    count: 0,
  });

  // Set of scheduled parents from buildSchedule
  const scheduledParentSet = useMemo(() => {
    const set = new Set<string>();
    buildSchedule.forEach((b) => {
      if (b.parent && b.parent.trim()) set.add(b.parent.trim());
    });
    return set;
  }, [buildSchedule]);

  // Extract unique parent assemblies
  const uniqueParents = useMemo(() => {
    const set = new Set<string>();
    explodedRows.forEach((r) => {
      if (r.parent) {
        if (scopeMode === 'PASTED_ONLY' && scheduledParentSet.size > 0) {
          if (scheduledParentSet.has(r.parent) || r.isScheduled) {
            set.add(r.parent);
          }
        } else {
          set.add(r.parent);
        }
      }
    });
    return Array.from(set).sort();
  }, [explodedRows, scopeMode, scheduledParentSet]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered Exploded Rows with active deletion and quantity overrides applied
  const filteredExplodedRows = useMemo(() => {
    return explodedRows
      .filter((row) => {
        const rowKey = row.id || `${row.parent}_${row.component}_${row.level}`;
        if (
          deletedRowKeys.includes(rowKey) ||
          deletedRowKeys.includes(row.component) ||
          deletedRowKeys.includes(`${row.parent}_${row.component}`)
        ) {
          return false;
        }

        // Scope filter: Pasted Parents Only vs All BOM
        if (scopeMode === 'PASTED_ONLY' && scheduledParentSet.size > 0) {
          const isScheduled = row.isScheduled || scheduledParentSet.has(row.parent);
          if (!isScheduled) return false;
        }

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          row.parent.toLowerCase().includes(searchLower) ||
          row.component.toLowerCase().includes(searchLower) ||
          (row.description && row.description.toLowerCase().includes(searchLower)) ||
          row.pathString.toLowerCase().includes(searchLower);

        const matchesParent = parentFilter === 'ALL' || row.parent === parentFilter;
        const matchesLevel = levelFilter === 'ALL' || String(row.level) === levelFilter;
        const matchesStock =
          stockFilter === 'ALL' ||
          (stockFilter === 'RAISE_ONLY' && row.raiseDecision && row.raiseDecision !== 'IN_STOCK') ||
          (stockFilter === 'IN_STOCK_ONLY' && row.raiseDecision === 'IN_STOCK');

        return matchesSearch && matchesParent && matchesLevel && matchesStock;
      })
      .map((row) => {
        const rowKey = row.id || `${row.parent}_${row.component}_${row.level}`;
        const overrideQty = qtyOverrides[rowKey] ?? qtyOverrides[row.component];
        if (overrideQty !== undefined) {
          const totalReq = Math.max(0, overrideQty);
          const avail = row.available ?? 0;
          const raiseQty = Math.max(0, totalReq - avail);
          const raiseDecision: 'IN_STOCK' | 'PARTIAL_STOCK' | 'RAISE_FULL' =
            avail >= totalReq ? 'IN_STOCK' : avail > 0 ? 'PARTIAL_STOCK' : 'RAISE_FULL';
          return {
            ...row,
            totalRequired: totalReq,
            raiseQty,
            raiseDecision,
            isEdited: true,
          };
        }
        return row;
      });
  }, [explodedRows, scopeMode, scheduledParentSet, searchTerm, parentFilter, levelFilter, stockFilter, deletedRowKeys, qtyOverrides]);

  // Consolidated Rows (Aggregated by Item)
  const consolidatedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        component: string;
        totalRequired: number;
        description?: string;
        parentQtyMap: Map<string, number>;
        available?: number;
        onHand?: number;
        isEdited?: boolean;
      }
    >();

    filteredExplodedRows.forEach((row) => {
      const existing = map.get(row.component);
      if (existing) {
        existing.totalRequired += row.totalRequired;
        const currentQty = existing.parentQtyMap.get(row.parent) || 0;
        existing.parentQtyMap.set(row.parent, currentQty + row.totalRequired);
        if ((row as any).isEdited) existing.isEdited = true;
      } else {
        const pMap = new Map<string, number>();
        pMap.set(row.parent, row.totalRequired);
        map.set(row.component, {
          component: row.component,
          totalRequired: row.totalRequired,
          description: row.description,
          parentQtyMap: pMap,
          available: row.available,
          onHand: row.onHand,
          isEdited: (row as any).isEdited || qtyOverrides[row.component] !== undefined,
        });
      }
    });

    return Array.from(map.values()).map((item) => {
      const overrideQty = qtyOverrides[item.component];
      const req = overrideQty !== undefined ? Math.max(0, overrideQty) : item.totalRequired;
      const avail = item.available ?? 0;
      let raiseDecision: 'IN_STOCK' | 'PARTIAL_STOCK' | 'RAISE_FULL' = 'IN_STOCK';
      let raiseQty = 0;
      if (avail >= req) {
        raiseDecision = 'IN_STOCK';
        raiseQty = 0;
      } else if (avail > 0) {
        raiseDecision = 'PARTIAL_STOCK';
        raiseQty = req - avail;
      } else {
        raiseDecision = 'RAISE_FULL';
        raiseQty = req;
      }

      const parentBreakdown = Array.from(item.parentQtyMap.entries()).map(([parent, qty]) => ({
        parent,
        qty,
      }));

      return {
        ...item,
        totalRequired: req,
        parentBreakdown,
        parentCount: item.parentQtyMap.size,
        available: avail,
        onHand: item.onHand ?? 0,
        raiseDecision,
        raiseQty,
        isEdited: item.isEdited || overrideQty !== undefined,
      };
    });
  }, [filteredExplodedRows, qtyOverrides]);

  // Active sorted rows based on view/consolidation
  const displayRows = useMemo(() => {
    if (viewMode === 'ITEM_QTY_ONLY' && consolidation === 'CONSOLIDATED') {
      return [...consolidatedRows].sort((a, b) => {
        if (sortField === 'totalRequired') {
          return sortOrder === 'asc' ? a.totalRequired - b.totalRequired : b.totalRequired - a.totalRequired;
        }
        if (sortField === 'available') {
          return sortOrder === 'asc' ? (a.available ?? 0) - (b.available ?? 0) : (b.available ?? 0) - (a.available ?? 0);
        }
        if (sortField === 'raiseQty') {
          return sortOrder === 'asc' ? (a.raiseQty ?? 0) - (b.raiseQty ?? 0) : (b.raiseQty ?? 0) - (a.raiseQty ?? 0);
        }
        return sortOrder === 'asc' ? a.component.localeCompare(b.component) : b.component.localeCompare(a.component);
      });
    }

    return [...filteredExplodedRows].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA ?? 0) - (valB ?? 0) : (valB ?? 0) - (valA ?? 0);
    });
  }, [viewMode, consolidation, consolidatedRows, filteredExplodedRows, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(displayRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayRows.slice(start, start + pageSize);
  }, [displayRows, currentPage, pageSize]);

  // Total Quantity sum
  const totalQuantitySum = useMemo(() => {
    return filteredExplodedRows.reduce((sum, r) => sum + r.totalRequired, 0);
  }, [filteredExplodedRows]);

  // Copy 2-column Item & Qty to clipboard for direct Excel pasting
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;

    // Attempt 1: Modern Navigator Clipboard API (Primary)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
      }
    }

    // Attempt 2: Synchronous execCommand fallback with viewport-attached focus
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Prevent scrolling or shifting layout
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2px';
      textArea.style.height = '2px';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0.01';
      
      document.body.appendChild(textArea);
      
      window.focus();
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      
      const syncOk = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (syncOk) return true;
    } catch (e) {
      console.warn('execCommand fallback failed:', e);
    }

    return false;
  };

  const handleCopyItemQty = async () => {
    try {
      let text = '';
      if (viewMode === 'ITEM_QTY_ONLY' && consolidation === 'CONSOLIDATED') {
        text = (displayRows as any[]).map((r) => `${r.component}\t${r.totalRequired}`).join('\n');
      } else if (viewMode === 'PARENT_ITEM_LEVEL') {
        text = (displayRows as ExplodedRow[]).map((r) => `${r.parent}\t${r.component}\t${r.totalRequired}`).join('\n');
      } else {
        text = (displayRows as ExplodedRow[]).map((r) => `${r.component}\t${r.totalRequired}`).join('\n');
      }

      if (!text.trim()) return;

      const ok = await copyTextToClipboard(text);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback modal if browser / iframe blocks automated clipboard writing
        setCopyModalData({ open: true, text, count: displayRows.length });
      }
    } catch (err) {
      console.error('Failed to copy', err);
      let text = (displayRows as any[]).map((r) => `${r.component}\t${r.totalRequired}`).join('\n');
      setCopyModalData({ open: true, text, count: displayRows.length });
    }
  };

  const handleExportCSV = () => {
    if (viewMode === 'ITEM_QTY_ONLY') {
      if (consolidation === 'CONSOLIDATED') {
        const exportData = (displayRows as any[]).map((r) => ({
          Item: r.component,
          Qty: r.totalRequired,
        }));
        exportTableToCSV(exportData, `Item_and_Qty_Consolidated_${new Date().toISOString().slice(0, 10)}.csv`);
      } else {
        const exportData = (displayRows as ExplodedRow[]).map((r) => ({
          Item: r.component,
          Qty: r.totalRequired,
        }));
        exportTableToCSV(exportData, `Item_and_Qty_${new Date().toISOString().slice(0, 10)}.csv`);
      }
    } else if (viewMode === 'PARENT_ITEM_LEVEL') {
      const exportData = (displayRows as ExplodedRow[]).map((r) => ({
        Parent: r.parent,
        Item: r.component,
        Level: `Level ${r.level}`,
        'Required Qty': r.totalRequired,
      }));
      exportTableToCSV(exportData, `Excel_BOM_Output_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const exportData = (displayRows as ExplodedRow[]).map((r) => ({
        Parent: r.parent,
        Component: r.component,
        'Final Qty': r.finalQty,
        'Build Qty': r.buildQty,
        'Total Required': r.totalRequired,
        Level: r.level,
        'Hierarchy Path': r.pathString,
        Description: r.description,
        'Direct Subassembly': r.subassembly || '',
      }));
      exportTableToCSV(exportData, `Parent_Breakdown_Detailed_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  return (
    <div id="parent-breakdown-table-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <GitFork className="w-4 h-4 text-amber-600" />
              <span>
                {viewMode === 'ITEM_QTY_ONLY'
                  ? 'OUTPUT TABLE (ITEM · QTY ONLY)'
                  : viewMode === 'PARENT_ITEM_LEVEL'
                  ? 'Power Query Output Table (Parent · Item · Level · Required Qty)'
                  : 'Detailed Parent Breakdown & Multiplier Audit'}
              </span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              {displayRows.length} {displayRows.length === 1 ? 'item' : 'items'} ({totalQuantitySum.toLocaleString()} total qty)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'ITEM_QTY_ONLY'
              ? 'Clean 2-column output table formatted with Item and Qty only for direct copy and export.'
              : viewMode === 'PARENT_ITEM_LEVEL'
              ? '4-column replication of the Excel Power Query output table (Parent, Item, Level, Required Qty).'
              : 'Detailed breakdown with multipliers, hierarchy trace, and top-level parent builds.'}
          </p>
        </div>

        {/* View Mode Toggle & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Selector: Pasted Parents Only vs All BOM */}
          {scheduledParentSet.size > 0 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setScopeMode('PASTED_ONLY');
                  setParentFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition ${
                  scopeMode === 'PASTED_ONLY'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Only show items for the pasted/scheduled parents"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pasted Parents ({scheduledParentSet.size})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScopeMode('ALL_BOM');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition ${
                  scopeMode === 'ALL_BOM'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show all parents in the BOM catalog"
              >
                <span>All BOM</span>
              </button>
            </div>
          )}

          {/* Format Selector: Item & Qty Only (Default) vs Parent/Item/Level vs Detailed */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setViewMode('ITEM_QTY_ONLY');
                setSortField('component');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
                viewMode === 'ITEM_QTY_ONLY'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Output format with Item and Qty only"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Item & Qty Only</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('PARENT_ITEM_LEVEL');
                setSortField('parent');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition ${
                viewMode === 'PARENT_ITEM_LEVEL'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="4-column format (Parent, Item, Level, Required Qty)"
            >
              <span>+ Parent & Level</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('DETAILED_AUDIT');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition ${
                viewMode === 'DETAILED_AUDIT'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Full Engineering Audit View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Audit</span>
            </button>
          </div>

          {/* Quick Copy 2-Column Table */}
          <button
            type="button"
            onClick={handleCopyItemQty}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title="Copy Item and Qty formatted for Excel paste"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Item & Qty!' : 'Copy Item & Qty'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Secondary Filter & Consolidation Sub-bar */}
      <div className="bg-slate-50/70 border-b border-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search and Parent Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-parent-breakdown"
              type="text"
              placeholder="Search item, part, or parent..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 lg:w-56"
            />
          </div>

          {/* Filter by Parent */}
          <select
            id="select-parent-filter"
            value={parentFilter}
            onChange={(e) => {
              setParentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 max-w-[170px]"
          >
            <option value="ALL">
              {scopeMode === 'PASTED_ONLY' ? `All Pasted Parents (${uniqueParents.length})` : `All Parents (${uniqueParents.length})`}
            </option>
            {uniqueParents.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Filter by Stock On Hand / Raise Decision */}
          <select
            id="select-stock-filter"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as StockFilterMode);
              setCurrentPage(1);
            }}
            className="bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-amber-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="RAISE_ONLY">⚠️ Parts Needing Raising (Shortage)</option>
            <option value="IN_STOCK_ONLY">✓ Fully In Stock (No Raise)</option>
          </select>

          {/* Level Filter (if relevant) */}
          {viewMode !== 'ITEM_QTY_ONLY' && (
            <select
              id="select-level-filter"
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Levels</option>
              <option value="2">Level 2 Only</option>
              <option value="3">Level 3 Only</option>
            </select>
          )}
        </div>

        {/* Right: Consolidation mode for Item & Qty */}
        {viewMode === 'ITEM_QTY_ONLY' && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Display rows:</span>
            <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setConsolidation('EXPLODED');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  consolidation === 'EXPLODED'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List all required items as exploded lines"
              >
                Line-by-Line ({filteredExplodedRows.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsolidation('CONSOLIDATED');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  consolidation === 'CONSOLIDATED'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Consolidate duplicate items and sum total quantities"
              >
                Consolidated Unique ({consolidatedRows.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scope Banner for Pasted Parents */}
      {scopeMode === 'PASTED_ONLY' && scheduledParentSet.size > 0 && (
        <div className="bg-emerald-50/90 border-b border-emerald-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-emerald-950">Pasted Parents Breakdown:</span>
            <span className="text-emerald-800">
              Showing exact required items for <strong>{scheduledParentSet.size} pasted parent{scheduledParentSet.size > 1 ? 's' : ''}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {Array.from(scheduledParentSet).slice(0, 8).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setParentFilter(p === parentFilter ? 'ALL' : p);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 font-mono text-[11px] font-bold rounded border transition ${
                  parentFilter === p
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                    : 'bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 border-emerald-200'
                }`}
                title={`Filter exclusively to parent ${p}`}
              >
                {p}
              </button>
            ))}
            {scheduledParentSet.size > 8 && (
              <span className="text-[11px] text-emerald-700 font-semibold px-1">
                +{scheduledParentSet.size - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Banner for Custom Line Qty Adjustments & Deletions */}
      {(Object.keys(qtyOverrides).length > 0 || deletedRowKeys.length > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 font-medium">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>Active Line Customizations:</strong>{' '}
              {Object.keys(qtyOverrides).length > 0 && (
                <span className="mr-2">✏️ {Object.keys(qtyOverrides).length} qty edit(s)</span>
              )}
              {deletedRowKeys.length > 0 && <span>🗑️ {deletedRowKeys.length} line(s) deleted</span>}
            </span>
          </div>
          {onResetCustomizations && (
            <button
              type="button"
              onClick={onResetCustomizations}
              className="inline-flex items-center space-x-1.5 bg-amber-200/70 hover:bg-amber-300 text-amber-950 px-3 py-1 rounded-md text-[11px] font-bold transition shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Customizations</span>
            </button>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto flex-1">
        {viewMode === 'ITEM_QTY_ONLY' ? (
          /* ========================================================================= */
          /* 1. OUTPUT TABLE: ITEM, QTY, AVAILABLE STOCK & RAISE DECISION             */
          /* ========================================================================= */
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-600 text-white font-bold tracking-wide border-b border-amber-700 select-none">
                <th
                  onClick={() => handleSort('component')}
                  className="px-5 py-3 cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Item</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-85" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalRequired')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-sm">Required Qty</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-85" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('available')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-sm">Available Stock</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-85" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('raiseQty')}
                  className="px-5 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-sm">Raise Decision / Action</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-85" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-sans">
                    No matching items found for your criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row: any, idx) => {
                  const req = row.totalRequired;
                  const avail = row.available ?? 0;
                  const raiseQty = row.raiseQty ?? Math.max(0, req - avail);
                  const isFullyInStock = avail >= req;
                  const rowKey = row.component;
                  const isEdited = row.isEdited || qtyOverrides[rowKey] !== undefined;

                  return (
                    <tr
                      key={row.id || row.component + idx}
                      className={`hover:bg-amber-50/50 transition ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      }`}
                    >
                      {/* Item */}
                      <td className="px-5 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-indigo-900 text-sm font-mono">{row.component}</span>
                            {row.description && (
                              <span className="text-xs font-normal text-slate-400 font-sans truncate max-w-xs">
                                ({row.description})
                              </span>
                            )}
                            {isEdited && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                edited
                              </span>
                            )}
                          </div>

                          {/* Parent Assemblies breakdown tags */}
                          {row.parentBreakdown && row.parentBreakdown.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 font-sans">
                              {row.parentBreakdown.map((pb: any) => (
                                <span
                                  key={pb.parent}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                                  title={`Required for parent ${pb.parent}: ${pb.qty} units`}
                                >
                                  <span className="text-slate-500 text-[10px]">for</span>
                                  <strong className="text-slate-900 font-semibold">{pb.parent}</strong>
                                  <span className="text-amber-800 font-bold font-mono">({pb.qty})</span>
                                </span>
                              ))}
                            </div>
                          ) : row.parent ? (
                            <div className="flex items-center space-x-1 text-[11px] font-sans text-slate-500">
                              <span>for</span>
                              <strong className="text-slate-800 font-semibold">{row.parent}</strong>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Required Qty with stepper & inline edit */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1 font-mono">
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, Math.max(0, req - 1))}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Decrease required quantity by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="1000000"
                            value={req}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (onUpdateQtyOverride) {
                                onUpdateQtyOverride(rowKey, isNaN(val) ? 0 : Math.max(0, val));
                              }
                            }}
                            className={`w-16 text-right font-bold text-xs px-1.5 py-0.5 rounded border font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              isEdited
                                ? 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                                : 'bg-white text-slate-900 border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, req + 1)}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Increase required quantity by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Available Stock */}
                      <td className="px-4 py-3 text-right font-bold text-sm">
                        <span className={avail > 0 ? 'text-emerald-700 font-mono' : 'text-slate-400 font-mono'}>
                          {avail.toLocaleString()}
                        </span>
                      </td>

                      {/* Raise Decision */}
                      <td className="px-5 py-3 text-right">
                        {isFullyInStock ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-sans font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ In Stock (No Raise)
                          </span>
                        ) : avail > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-sans font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            ⚠️ Raise {raiseQty.toLocaleString()} (Has {avail})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-sans font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            🚨 Raise Full {raiseQty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Delete Line Action */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRowKey && onDeleteRowKey(rowKey)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={`Delete item line ${row.component}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary */}
            {displayRows.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 font-bold border-t-2 border-amber-300">
                  <td className="px-5 py-2.5 text-amber-950 font-sans uppercase tracking-wider text-xs">
                    Total ({displayRows.length} {displayRows.length === 1 ? 'row' : 'rows'})
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-950 font-mono text-sm">
                    {totalQuantitySum.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-800 font-mono text-sm">
                    {displayRows.reduce((acc: number, r: any) => acc + (r.available ?? 0), 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right text-amber-950 font-mono text-sm">
                    Raise Total: {displayRows.reduce((acc: number, r: any) => acc + (r.raiseQty ?? Math.max(0, r.totalRequired - (r.available ?? 0))), 0).toLocaleString()} units
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        ) : viewMode === 'PARENT_ITEM_LEVEL' ? (
          /* ========================================================================= */
          /* 2. 6-COLUMN FORMAT: PARENT, ITEM, LEVEL, REQ QTY, AVAILABLE, RAISE STATUS  */
          /* ========================================================================= */
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-600 text-white font-bold tracking-wide border-b border-amber-700 select-none">
                <th
                  onClick={() => handleSort('parent')}
                  className="px-4 py-3 cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Parent</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('component')}
                  className="px-4 py-3 cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Item</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('level')}
                  className="px-4 py-3 cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Level</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalRequired')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Required Qty</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('available')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Available</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('raiseQty')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-amber-700 transition"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Raise Action</span>
                    <ArrowUpDown className="w-3 h-3 opacity-75" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No matching exploded rows found for your criteria.
                  </td>
                </tr>
              ) : (
                (paginatedRows as ExplodedRow[]).map((row, idx) => {
                  const req = row.totalRequired;
                  const avail = row.available ?? 0;
                  const raiseQty = row.raiseQty ?? Math.max(0, req - avail);
                  const isFullyInStock = avail >= req;
                  const rowKey = row.id || `${row.parent}_${row.component}_${row.level}`;
                  const isEdited = (row as any).isEdited || qtyOverrides[rowKey] !== undefined;

                  return (
                    <tr
                      key={row.id || idx}
                      className={`hover:bg-amber-50/40 transition ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {/* Parent */}
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        {row.parent}
                      </td>

                      {/* Item */}
                      <td className="px-4 py-2.5 font-bold text-indigo-700">
                        <div className="flex items-center space-x-2">
                          <span>{row.component}</span>
                          {row.subassembly && (
                            <span className="text-[10px] font-sans font-normal text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              sub: {row.subassembly}
                            </span>
                          )}
                          {isEdited && (
                            <span className="px-1 py-0.1 rounded text-[9px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              edited
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold border ${
                            row.level === 3
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          Level {row.level}
                        </span>
                      </td>

                      {/* Required Qty with Stepper */}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end space-x-1 font-mono">
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, Math.max(0, req - 1))}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Decrease quantity by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="1000000"
                            value={req}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (onUpdateQtyOverride) {
                                onUpdateQtyOverride(rowKey, isNaN(val) ? 0 : Math.max(0, val));
                              }
                            }}
                            className={`w-16 text-right font-bold text-xs px-1.5 py-0.5 rounded border font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              isEdited
                                ? 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                                : 'bg-white text-slate-900 border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, req + 1)}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Increase quantity by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Available */}
                      <td className="px-4 py-2.5 text-right font-bold text-sm">
                        <span className={avail > 0 ? 'text-emerald-700 font-mono' : 'text-slate-400 font-mono'}>
                          {avail.toLocaleString()}
                        </span>
                      </td>

                      {/* Raise Action */}
                      <td className="px-4 py-2.5 text-right">
                        {isFullyInStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            In Stock
                          </span>
                        ) : avail > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            Raise {raiseQty.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            Raise Full {raiseQty.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRowKey && onDeleteRowKey(rowKey)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={`Delete row ${row.component}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* ========================================================================= */
          /* 3. DETAILED ENGINEERING AUDIT VIEW                                         */
          /* ========================================================================= */
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                <th
                  onClick={() => handleSort('parent')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Parent Assembly (L1)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('component')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Resolved Component</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('level')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center space-x-1">
                    <span>Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Hierarchy Path</th>
                <th
                  onClick={() => handleSort('totalRequired')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Total Required</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('available')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Available</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('raiseQty')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Raise Needed</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No matching exploded rows found for your criteria.
                  </td>
                </tr>
              ) : (
                (paginatedRows as ExplodedRow[]).map((row, idx) => {
                  const req = row.totalRequired;
                  const avail = row.available ?? 0;
                  const raiseQty = row.raiseQty ?? Math.max(0, req - avail);
                  const isFullyInStock = avail >= req;
                  const rowKey = row.id || `${row.parent}_${row.component}_${row.level}`;
                  const isEdited = (row as any).isEdited || qtyOverrides[rowKey] !== undefined;

                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-indigo-600">
                        {row.parent}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{row.component}</span>
                          {isEdited && (
                            <span className="px-1 py-0.1 rounded text-[9px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              edited
                            </span>
                          )}
                        </div>
                        {row.description && (
                          <div className="text-[11px] text-slate-400 font-sans truncate max-w-xs">
                            {row.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                            row.level === 3
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          Level {row.level}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-xs text-slate-500 truncate max-w-xs">
                        {row.pathString}
                      </td>
                      {/* Required Qty with Stepper */}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end space-x-1 font-mono">
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, Math.max(0, req - 1))}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Decrease quantity by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="1000000"
                            value={req}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (onUpdateQtyOverride) {
                                onUpdateQtyOverride(rowKey, isNaN(val) ? 0 : Math.max(0, val));
                              }
                            }}
                            className={`w-16 text-right font-bold text-xs px-1.5 py-0.5 rounded border font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              isEdited
                                ? 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                                : 'bg-white text-slate-900 border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQtyOverride && onUpdateQtyOverride(rowKey, req + 1)}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-300 transition"
                            title="Increase quantity by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                        {avail.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isFullyInStock ? (
                          <span className="text-emerald-600 font-sans font-semibold text-xs">0 (In Stock)</span>
                        ) : (
                          <span className="text-amber-700 font-bold text-xs">{raiseQty.toLocaleString()}</span>
                        )}
                      </td>
                      {/* Delete Action */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteRowKey && onDeleteRowKey(rowKey)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={`Delete row ${row.component}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="p-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500">
          Showing{' '}
          <span className="font-semibold text-slate-700">
            {displayRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-700">
            {Math.min(currentPage * pageSize, displayRows.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-700">{displayRows.length}</span> rows
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none"
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="500">500 per page</option>
          </select>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 rounded text-xs transition"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-medium text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-200 rounded text-xs transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Copy Text Fallback Modal */}
      {copyModalData.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">Copy Formatted Item & Qty ({copyModalData.count} items)</h3>
              </div>
              <button
                type="button"
                onClick={() => setCopyModalData({ open: false, text: '', count: 0 })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Click inside the text box below or press <strong className="text-indigo-600">Ctrl+C</strong> to copy the tab-delimited list for Excel pasting:
              </p>

              <textarea
                readOnly
                autoFocus
                value={copyModalData.text}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-56 p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none cursor-pointer"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyTextToClipboard(copyModalData.text);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Text Now'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      const container = (e.currentTarget.parentElement?.parentElement?.previousElementSibling as HTMLTextAreaElement);
                      if (container) {
                        container.focus();
                        container.select();
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    Select All
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCopyModalData({ open: false, text: '', count: 0 })}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

