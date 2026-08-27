import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Boxes,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { SubassemblyToMake } from '../types/bom';
import { exportTableToCSV } from '../utils/exporter';

interface SubassembliesToMakeViewProps {
  subassemblies: SubassemblyToMake[];
  onOpenPasteModal?: () => void;
}

export const SubassembliesToMakeView: React.FC<SubassembliesToMakeViewProps> = ({
  subassemblies,
  onOpenPasteModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SHORTAGE' | 'READY'>('ALL');

  const filteredSubs = useMemo(() => {
    return subassemblies.filter((sub) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        sub.subassembly.toLowerCase().includes(searchLower) ||
        (sub.description && sub.description.toLowerCase().includes(searchLower)) ||
        sub.demandedByParents.some((p) => p.parent.toLowerCase().includes(searchLower)) ||
        sub.childComponents.some((c) => c.component.toLowerCase().includes(searchLower));

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'SHORTAGE' && sub.hasShortage) ||
        (filterStatus === 'READY' && !sub.hasShortage);

      return matchesSearch && matchesStatus;
    });
  }, [subassemblies, searchTerm, filterStatus]);

  const totalSubUnits = useMemo(() => {
    return subassemblies.reduce((acc, s) => acc + s.totalUnitsToMake, 0);
  }, [subassemblies]);

  const shortageCount = useMemo(() => {
    return subassemblies.filter((s) => s.hasShortage).length;
  }, [subassemblies]);

  const handleExport = () => {
    const exportData: any[] = [];
    subassemblies.forEach((s) => {
      s.demandedByParents.forEach((p) => {
        s.childComponents.forEach((c) => {
          exportData.push({
            'Subassembly SKU': s.subassembly,
            'Total Units To Make': s.totalUnitsToMake,
            'Demanding Parent': p.parent,
            'Parent Build Qty': p.parentBuildQty,
            'Sub Qty Per Parent': p.subQtyPerParent,
            'Child Component SKU': c.component,
            'Qty Per Subassembly': c.qtyPerSub,
            'Total Child Required': c.totalRequiredForSubs,
            'Child On Hand Stock': c.onHand,
            'Child Stock Status': c.stockStatus,
          });
        });
      });
    });

    exportTableToCSV(exportData, `Subassemblies_To_Make_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subassembly Types
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {subassemblies.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unique subassemblies to manufacture
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total WIP Units to Make
            </span>
            <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
              {totalSubUnits.toLocaleString()} EA
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aggregate intermediate build quantity
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Readiness Status
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${shortageCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {subassemblies.length - shortageCount} / {subassemblies.length}
              </span>
              <span className="text-xs text-slate-500">Ready</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {shortageCount > 0 ? `${shortageCount} subassemblies have part shortages` : 'All component parts are in stock'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shortageCount > 0 ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
            {shortageCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Main Table & List Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>Subassemblies to Make (Level 2 with Level 3 Subs)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                {filteredSubs.length} Active Subassemblies
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              When you paste in the parent and build quantity, this list calculates exactly how many subassemblies you have to build.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subassembly or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 lg:w-56"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Subassemblies</option>
              <option value="READY">Ready to Build</option>
              <option value="SHORTAGE">Parts Shortage</option>
            </select>

            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={subassemblies.length === 0}
              className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Subassemblies Content */}
        {subassemblies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No Subassemblies Currently Scheduled
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              None of the active parents in your build schedule contain multi-level subassemblies (Level 3 components).
              Try scheduling parents like <span className="font-mono font-bold text-indigo-600">710-RSL-00003</span>, <span className="font-mono font-bold text-indigo-600">710-RSL-00004</span>, or <span className="font-mono font-bold text-indigo-600">CGA52APH30</span>.
            </p>
            {onOpenPasteModal && (
              <button
                type="button"
                onClick={onOpenPasteModal}
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Paste Excel Build Schedule</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSubs.map((sub, idx) => (
              <div
                key={sub.subassembly || idx}
                className="p-4 hover:bg-slate-50/70 transition space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {sub.subassembly}
                        </span>
                        {sub.hasShortage ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Parts Shortage</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Stock Ready</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sub.description || 'Intermediate Subassembly'}
                      </p>
                    </div>
                  </div>

                  {/* High Visibility Build Target Badge */}
                  <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl">
                    <span className="text-xs text-indigo-700 font-medium">To Make:</span>
                    <span className="font-mono font-bold text-base text-indigo-700">
                      {sub.totalUnitsToMake.toLocaleString()} EA
                    </span>
                  </div>
                </div>

                {/* Subassembly Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Demanding Parents */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <GitBranch className="w-3 h-3 text-indigo-600" />
                      <span>Demanded By Top Parents ({sub.demandedByParents.length})</span>
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {sub.demandedByParents.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800">{p.parent}</span>
                            <span className="text-slate-400 text-[10px] font-sans">
                              (Build {p.parentBuildQty} × {p.subQtyPerParent}/parent)
                            </span>
                          </div>
                          <span className="font-bold text-indigo-600">
                            {p.requiredQty.toLocaleString()} EA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Child Components (Level 3 Parts) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>Level 3 Components Needed to Build</span>
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {sub.childComponents.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 font-mono"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800">{c.component}</span>
                            <span className="text-slate-400 text-[10px] font-sans">
                              ({c.qtyPerSub}/sub)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 font-sans">
                            <span className="font-mono font-bold text-slate-800">
                              {c.totalRequiredForSubs.toLocaleString()} EA req
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                c.stockStatus === 'SHORTAGE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Stock: {c.onHand}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
