import React from 'react';
import { Layers, Zap, Download, RefreshCw, FileSpreadsheet, CheckCircle2, ChevronDown } from 'lucide-react';
import { BOMMode } from '../types/bom';

interface HeaderProps {
  mode: BOMMode;
  onModeChange: (mode: BOMMode) => void;
  onLoadSample: (datasetKey: 'powerquery' | 'multilevel' | 'scale1000') => void;
  onExportExcel: () => void;
  onDownloadTemplate: (type: 'BOM_3_LEVEL' | 'BOM_MULTI_LEVEL' | 'BUILD_SCHEDULE' | 'INVENTORY') => void;
  isRecalculating: boolean;
  executionTimeMs: number;
  totalItemsExploded: number;
  hasShortages: boolean;
  lastSavedAt?: string | null;
  onClearSavedData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onLoadSample,
  onExportExcel,
  onDownloadTemplate,
  isRecalculating,
  executionTimeMs,
  totalItemsExploded,
  hasShortages,
  lastSavedAt,
  onClearSavedData,
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-800">
                  SUB BOM EXPLOSION <span className="font-light text-slate-400">| v2.4</span>
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-semibold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>ENGINE READY</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Excel Power Query BOM Explosion & Hierarchical Requirements Planning
              </p>
            </div>
          </div>

          {/* Engine Mode Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Mode Selector */}
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center text-xs">
              <button
                id="btn-mode-powerquery"
                type="button"
                onClick={() => onModeChange('POWER_QUERY_3_LEVEL')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'POWER_QUERY_3_LEVEL'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Excel Power Query: Level 1, Level 2, Level 2 Qty, Level 3, Level 3 Qty rules"
              >
                Power Query (3-Level)
              </button>
              <button
                id="btn-mode-multilevel"
                type="button"
                onClick={() => onModeChange('MULTI_LEVEL_RECURSIVE')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'MULTI_LEVEL_RECURSIVE'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Recursive unlimited depth BOM tree explosion"
              >
                Recursive (N-Level Tree)
              </button>
            </div>

            {/* Performance Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-600">
              <Zap className={`w-3.5 h-3.5 text-amber-500 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span className="font-mono font-semibold text-slate-800">{executionTimeMs.toFixed(1)}ms</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">{totalItemsExploded} Rows</span>
            </div>

            {/* Auto-Saved Status Badge */}
            {lastSavedAt && (
              <div
                className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs"
                title="Your build schedule edits, pasted records, and inventory changes are automatically saved in local browser storage"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Saved</span>
                <span className="text-[10px] text-emerald-600 font-mono">({lastSavedAt})</span>
              </div>
            )}

            {/* Template Dropdown */}
            <div className="relative group">
              <button
                id="btn-download-templates"
                type="button"
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 shadow-2xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Download Sample Formats
                </div>
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('BOM_3_LEVEL')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>3-Level PowerQuery BOM (.xlsx)</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('BOM_MULTI_LEVEL')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>Multi-Level Hierarchical BOM</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('BUILD_SCHEDULE')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>Build Schedule Template</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadTemplate('INVENTORY')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>Inventory / Stock Template</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Quick Demo Datasets */}
            <div className="relative group">
              <button
                id="btn-sample-data"
                type="button"
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 shadow-2xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Demo Data</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Demonstration Dataset
                </div>
                <button
                  type="button"
                  onClick={() => onLoadSample('powerquery')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="font-semibold text-indigo-600">Prompt Demo (710-RSL-00003)</div>
                  <div className="text-[11px] text-slate-500">PowerQuery 3-level parts with MS30M & P46-100</div>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('multilevel')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition-colors"
                >
                  <div className="font-semibold text-emerald-600">Drone & Avionics (5-Level)</div>
                  <div className="text-[11px] text-slate-500">Deep recursive tree with subassemblies & MRP</div>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('scale1000')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition-colors"
                >
                  <div className="font-semibold text-purple-600">High-Volume Simulation (1,000+ Parts)</div>
                  <div className="text-[11px] text-slate-500">Stress-test real-time sub-millisecond explosion</div>
                </button>
              </div>
            </div>

            {/* Export Excel Button */}
            <button
              id="btn-export-excel"
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Results</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
