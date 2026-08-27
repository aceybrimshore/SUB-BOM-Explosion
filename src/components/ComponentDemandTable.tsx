import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Layers,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react';
import { ComponentDemandSummary } from '../types/bom';
import { exportTableToCSV } from '../utils/exporter';

interface ComponentDemandTableProps {
  summaries: ComponentDemandSummary[];
  isShortageFilterActive: boolean;
  onClearShortageFilter: () => void;
}

type SortField = 'component' | 'totalGrossDemand' | 'onHand' | 'netShortage' | 'status' | 'totalCost' | 'leadTimeDays' | 'parentCount';
type SortOrder = 'asc' | 'desc';

export const ComponentDemandTable: React.FC<ComponentDemandTableProps> = ({
  summaries,
  isShortageFilterActive,
  onClearShortageFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SHORTAGE' | 'LOW_STOCK' | 'HEALTHY'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Purchased' | 'Subassembly'>('ALL');
  const [sortField, setSortField] = useState<SortField>('netShortage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync external shortage filter with local filter state
  React.useEffect(() => {
    if (isShortageFilterActive) {
      setStatusFilter('SHORTAGE');
    }
  }, [isShortageFilterActive]);

  const toggleRow = (component: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(component)) {
        next.delete(component);
      } else {
        next.add(component);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return summaries.filter((item) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.component.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        item.usedIn.some((u) => u.parent.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SHORTAGE' && item.status === 'SHORTAGE') ||
        (statusFilter === 'LOW_STOCK' && item.status === 'LOW_STOCK') ||
        (statusFilter === 'HEALTHY' && item.status === 'HEALTHY');

      // Type filter
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'Purchased' && item.isLeaf) ||
        (typeFilter === 'Subassembly' && !item.isLeaf);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [summaries, searchTerm, statusFilter, typeFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'status') {
        const order = { SHORTAGE: 3, LOW_STOCK: 2, HEALTHY: 1 };
        valA = order[a.status];
        valB = order[b.status];
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? (valA ?? 0) - (valB ?? 0) : (valB ?? 0) - (valA ?? 0);
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleExportCSV = () => {
    const exportData = sortedData.map((d) => ({
      Component: d.component,
      Description: d.description,
      Type: d.partType,
      'Total Gross Demand': d.totalGrossDemand,
      'On Hand': d.onHand,
      'Safety Stock': d.safetyStock,
      'Net Shortage': d.netShortage,
      'Projected Available': d.projectedAvailable,
      Status: d.status,
      Unit: d.unit,
      'Unit Cost': d.unitCost,
      'Total Cost': d.totalCost,
      'Lead Time (Days)': d.leadTimeDays,
      'Parent Assemblies Count': d.parentCount,
    }));
    exportTableToCSV(exportData, `MRP_Component_Demand_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div id="component-demand-table-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Top Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Component Demand & MRP Requirements Table</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
              {filteredData.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated gross requirements, inventory on-hand, and net shortage purchase orders.
          </p>
        </div>

        {/* Filter & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-component-demand"
              type="text"
              placeholder="Search component or parent..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 lg:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value as any;
              setStatusFilter(val);
              if (val !== 'SHORTAGE' && isShortageFilterActive) {
                onClearShortageFilter();
              }
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="SHORTAGE">⚠️ Shortages Only</option>
            <option value="LOW_STOCK">⚡ Low Buffer Only</option>
            <option value="HEALTHY">✓ Healthy Only</option>
          </select>

          {/* Type Filter */}
          <select
            id="select-type-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Part Types</option>
            <option value="Purchased">Purchased (Leaf)</option>
            <option value="Subassembly">Subassemblies</option>
          </select>

          {/* Export CSV */}
          <button
            id="btn-export-demand-csv"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition hover:text-indigo-600"
            title="Export filtered component table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Active Shortage Banner */}
      {statusFilter === 'SHORTAGE' && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Showing only components with insufficient stock for planned build schedule.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              onClearShortageFilter();
            }}
            className="text-rose-700 hover:text-rose-900 underline font-semibold"
          >
            Show All Components
          </button>
        </div>
      )}

      {/* Responsive Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider select-none">
              <th className="py-3 px-3 w-8"></th>
              <th
                onClick={() => handleSort('component')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Component / Part #</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Description & Type</th>
              <th
                onClick={() => handleSort('totalGrossDemand')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total Gross Demand</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('onHand')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>On Hand</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Safety Buffer</th>
              <th
                onClick={() => handleSort('netShortage')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Net Shortage</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Stock Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalCost')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Spend ($)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('parentCount')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Where-Used</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                  No components found matching current search/filter criteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isExpanded = expandedRows.has(row.component);
                return (
                  <React.Fragment key={row.component}>
                    <tr
                      onClick={() => toggleRow(row.component)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${
                        row.status === 'SHORTAGE'
                          ? 'bg-rose-50/40'
                          : row.status === 'LOW_STOCK'
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400">
                        {row.usedIn.length > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )
                        ) : null}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-indigo-600 font-semibold">{row.component}</span>
                          {!row.isLeaf && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-sans font-bold border border-indigo-200">
                              Subassy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 max-w-xs truncate" title={row.description}>
                        {row.description || <span className="text-slate-400 italic">No description</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {row.totalGrossDemand.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-normal font-sans">{row.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.onHand.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {row.safetyStock.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {row.netShortage > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            -{row.netShortage.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {row.status === 'SHORTAGE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Shortage
                          </span>
                        ) : row.status === 'LOW_STOCK' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Buffer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        ${row.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-sans">
                          {row.parentCount} {row.parentCount === 1 ? 'Parent' : 'Parents'}
                        </span>
                      </td>
                    </tr>

                    {/* Where-Used Expanded Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-y border-slate-200">
                        <td colSpan={10} className="p-4 pl-12">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Where-Used Parent Breakdown for {row.component}</span>
                              </h4>
                              <span className="text-[11px] text-slate-500 font-sans">
                                Lead Time: <strong className="text-slate-700">{row.leadTimeDays} days</strong> | Unit Cost: <strong className="text-slate-700">${row.unitCost}</strong>
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {row.usedIn.map((usage, uIdx) => (
                                <div
                                  key={uIdx}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs font-mono">{usage.parent}</span>
                                    <span className="text-[11px] text-slate-500">Build Target: {usage.buildQty}</span>
                                  </div>
                                  <div className="mt-2 flex items-baseline justify-between text-xs font-mono border-t border-slate-200/60 pt-1.5">
                                    <span className="text-slate-500">Qty/Assembly: {usage.finalQty}</span>
                                    <span className="font-bold text-indigo-600">Demand: {usage.totalRequired.toLocaleString()} {row.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-sans">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span className="text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
          >
            Previous
          </button>
          <span className="px-2 py-1 text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
