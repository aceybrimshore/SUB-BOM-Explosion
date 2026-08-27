import React, { useRef } from 'react';
import { Upload, FileCheck, Play, Layers, Calendar, Package, Info, RefreshCw, Sliders, ClipboardPaste } from 'lucide-react';
import { BOMRawRecord, BuildScheduleRecord, InventoryItem } from '../types/bom';

interface UploadSectionProps {
  bomSource: BOMRawRecord[];
  buildSchedule: BuildScheduleRecord[];
  inventory?: InventoryItem[];
  bomFileName: string;
  scheduleFileName: string;
  inventoryFileName?: string;
  onUploadBOM: (file: File) => void;
  onUploadSchedule: (file: File) => void;
  onUploadInventory?: (file: File) => void;
  onRunExplosion: () => void;
  isAutoExplode: boolean;
  onToggleAutoExplode: (val: boolean) => void;
  defaultBuildQty: number;
  onChangeDefaultBuildQty: (val: number) => void;
  onResetToDemo: () => void;
  onOpenPasteModal?: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  bomSource,
  buildSchedule,
  inventory = [],
  bomFileName,
  scheduleFileName,
  inventoryFileName,
  onUploadBOM,
  onUploadSchedule,
  onUploadInventory,
  onRunExplosion,
  isAutoExplode,
  onToggleAutoExplode,
  defaultBuildQty,
  onChangeDefaultBuildQty,
  onResetToDemo,
  onOpenPasteModal,
}) => {
  const bomInputRef = useRef<HTMLInputElement>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const inventoryInputRef = useRef<HTMLInputElement>(null);

  return (
    <div id="upload-control-section" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Data Source Management & Calculation Engine
          </label>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Input Files & Processing Rules</span>
            <span className="text-xs font-normal text-slate-500">
              (Supports .xlsx, .xls, .csv, .tsv, & Excel Paste)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload or paste your BOM Source, Build Schedule, and Stock On-Hand to instantly evaluate part availability and raise decisions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Paste from Excel */}
          {onOpenPasteModal && (
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paste Excel Schedule</span>
            </button>
          )}

          {/* Default Build Qty Setting */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-medium">Default Qty (Rule 4):</span>
            <input
              id="input-default-build-qty"
              type="number"
              min="1"
              max="100000"
              value={defaultBuildQty}
              onChange={(e) => onChangeDefaultBuildQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-300 text-center font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="If a parent has no Build Schedule entry, use this default quantity (Rule 4: Default = 1)"
            />
          </div>

          {/* Auto Explode Toggle */}
          <label className="inline-flex items-center cursor-pointer select-none bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 font-medium hover:bg-slate-100/80 transition">
            <input
              type="checkbox"
              checked={isAutoExplode}
              onChange={(e) => onToggleAutoExplode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 relative mr-2"></div>
            <span>Auto-Calculate</span>
          </label>

          {/* Run Explosion Button */}
          <button
            id="btn-run-explosion"
            type="button"
            onClick={onRunExplosion}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN EXPLOSION</span>
          </button>
        </div>
      </div>

      {/* 3 Ingestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* 1. BOM Source File */}
        <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50/20 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. BOM Source Table
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-white text-indigo-700 rounded font-mono font-semibold border border-slate-200 shadow-2xs">
                {bomSource.length} lines
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Level 1 (Parent), Level 2, Level 2 Qty, Level 3 (Sub-part), Level 3 Qty.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={bomInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                if (e.target.files?.[0]) onUploadBOM(e.target.files[0]);
              }}
              className="hidden"
            />
            <button
              id="btn-upload-bom"
              type="button"
              onClick={() => bomInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition hover:text-indigo-600"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change BOM File</span>
            </button>
            {bomFileName && (
              <span className="text-[11px] text-emerald-600 font-medium truncate max-w-[120px]" title={bomFileName}>
                ✓ {bomFileName}
              </span>
            )}
          </div>
        </div>

        {/* 2. Build Schedule File & Quick Paste */}
        <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 hover:border-emerald-400 hover:bg-emerald-50/20 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Build Schedule
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-white text-emerald-700 rounded font-mono font-semibold border border-slate-200 shadow-2xs">
                {buildSchedule.length} parents
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Parent Assembly & Planned Build Quantities (joined by BOM Level 1).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={scheduleInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                if (e.target.files?.[0]) onUploadSchedule(e.target.files[0]);
              }}
              className="hidden"
            />
            <button
              id="btn-upload-build-schedule"
              type="button"
              onClick={() => scheduleInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition hover:text-emerald-600"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            {onOpenPasteModal && (
              <button
                type="button"
                onClick={onOpenPasteModal}
                className="inline-flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-lg text-xs font-bold shadow-2xs transition"
                title="Paste Parent & Qty columns from Excel"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}
            {scheduleFileName && !onOpenPasteModal && (
              <span className="text-[11px] text-emerald-600 font-medium truncate max-w-[120px]" title={scheduleFileName}>
                ✓ {scheduleFileName}
              </span>
            )}
          </div>
        </div>

        {/* 3. Stock On Hand CSV */}
        <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 hover:border-amber-400 hover:bg-amber-50/20 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Stock On Hand
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-white text-amber-700 rounded font-mono font-semibold border border-slate-200 shadow-2xs">
                {inventory.length} SKUs
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              On Hand, Available & Committed stock for real-time parts raise evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inventoryInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                if (e.target.files?.[0] && onUploadInventory) onUploadInventory(e.target.files[0]);
              }}
              className="hidden"
            />
            <button
              id="btn-upload-inventory"
              type="button"
              onClick={() => inventoryInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition hover:text-amber-600"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Update Stock CSV</span>
            </button>
            {inventoryFileName && (
              <span className="text-[11px] text-emerald-600 font-medium truncate max-w-[120px]" title={inventoryFileName}>
                ✓ {inventoryFileName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
