/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GitFork,
  Layers,
  Database,
  Download,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Wrench,
  ClipboardPaste,
} from 'lucide-react';

import {
  BOMMode,
  BOMRawRecord,
  BuildScheduleRecord,
  InventoryItem,
  ExplosionResult,
} from './types/bom';

import { runBOMExplosion } from './utils/bomEngine';
import { parseUploadedFile, mapToBOMSource, mapToBuildSchedule, mapToInventory } from './utils/fileParser';
import { exportToExcel, downloadStarterTemplate } from './utils/exporter';
import { loadPersistedState, savePersistedState, clearPersistedState } from './utils/storage';

import {
  SAMPLE_POWER_QUERY_BOM,
  SAMPLE_POWER_QUERY_BUILD_SCHEDULE,
  SAMPLE_INVENTORY,
  SAMPLE_MULTI_LEVEL_BOM,
  SAMPLE_MULTI_LEVEL_BUILD_SCHEDULE,
  SAMPLE_MULTI_LEVEL_INVENTORY,
  generateHighVolumeDataset,
} from './data/sampleDatasets';
import { getInitialOnHandInventory } from './data/userInventory';

import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { KpiSummary } from './components/KpiSummary';
import { ParentBreakdownTable } from './components/ParentBreakdownTable';
import { HierarchicalTreeView } from './components/HierarchicalTreeView';
import { BOMSourceInspector } from './components/BOMSourceInspector';
import { SubassembliesToMakeView } from './components/SubassembliesToMakeView';
import { ExcelPasteModal } from './components/ExcelPasteModal';

export default function App() {
  // Load persisted state if available
  const [initialPersisted] = useState(() => loadPersistedState());

  // State: Mode & Execution
  const [mode, setMode] = useState<BOMMode>(initialPersisted?.mode || 'POWER_QUERY_3_LEVEL');
  const [defaultBuildQty, setDefaultBuildQty] = useState<number>(initialPersisted?.defaultBuildQty ?? 1);
  const [isAutoExplode, setIsAutoExplode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'subs' | 'tree' | 'bomSource'>('breakdown');
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);

  // State: Raw Data (Restored from browser auto-save OR initial sample data)
  const [bomSource, setBomSource] = useState<BOMRawRecord[]>(initialPersisted?.bomSource || SAMPLE_POWER_QUERY_BOM);
  const [buildSchedule, setBuildSchedule] = useState<BuildScheduleRecord[]>(initialPersisted?.buildSchedule || SAMPLE_POWER_QUERY_BUILD_SCHEDULE);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialPersisted?.inventory || getInitialOnHandInventory());

  // File names
  const [bomFileName, setBomFileName] = useState<string>(initialPersisted?.bomFileName || 'BOM_Source_Default.csv');
  const [scheduleFileName, setScheduleFileName] = useState<string>(initialPersisted?.scheduleFileName || 'Build_Qty_Excel_Pasted.xlsx');
  const [inventoryFileName, setInventoryFileName] = useState<string>(initialPersisted?.inventoryFileName || 'Stock_On_Hand.csv');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialPersisted?.lastSavedAt || null);

  // Manual trigger counter when auto-explode is off
  const [manualTriggerCount, setManualTriggerCount] = useState<number>(0);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);

  // State: Custom Line Qty Overrides & Deletions
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>(initialPersisted?.qtyOverrides || {});
  const [deletedRowKeys, setDeletedRowKeys] = useState<string[]>(initialPersisted?.deletedRowIds || []);

  const handleUpdateQtyOverride = (key: string, qty: number) => {
    setQtyOverrides((prev) => ({
      ...prev,
      [key]: Math.max(0, qty),
    }));
  };

  const handleDeleteRowKey = (key: string) => {
    setDeletedRowKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const handleDeleteRowKeys = (keys: string[]) => {
    setDeletedRowKeys((prev) => {
      const set = new Set(prev);
      keys.forEach((k) => set.add(k));
      return Array.from(set);
    });
  };

  const handleResetCustomizations = () => {
    setQtyOverrides({});
    setDeletedRowKeys([]);
  };

  // Auto-Save Effect: Runs whenever data, settings, or file names update
  useEffect(() => {
    const savedTime = savePersistedState({
      bomSource,
      buildSchedule,
      inventory,
      bomFileName,
      scheduleFileName,
      inventoryFileName,
      mode,
      defaultBuildQty,
      qtyOverrides,
      deletedRowIds: deletedRowKeys,
    });
    if (savedTime) {
      setLastSavedAt(savedTime);
    }
  }, [bomSource, buildSchedule, inventory, bomFileName, scheduleFileName, inventoryFileName, mode, defaultBuildQty, qtyOverrides, deletedRowKeys]);

  // Build description map & inventory map
  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    inventory.forEach((item) => map.set(item.partNumber.trim(), item));
    return map;
  }, [inventory]);

  const partDescriptions = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((i) => {
      if (i.description) map.set(i.partNumber.trim(), i.description);
    });
    bomSource.forEach((b) => {
      const c = (b.level3 || b.level2 || b.component || '').trim();
      if (c && b.description) map.set(c, b.description);
    });
    return map;
  }, [inventory, bomSource]);

  // Main Explosion Engine Calculation
  const explosionResult: ExplosionResult = useMemo(() => {
    return runBOMExplosion(
      bomSource,
      buildSchedule,
      inventoryMap,
      mode,
      {
        defaultBuildQty,
        partDescriptions,
      }
    );
  }, [
    bomSource,
    buildSchedule,
    inventoryMap,
    mode,
    defaultBuildQty,
    partDescriptions,
    isAutoExplode ? [bomSource, buildSchedule, inventory] : manualTriggerCount,
  ]);

  // Flash notification helper
  const notify = (msg: string) => {
    setUploadNotification(msg);
    setTimeout(() => setUploadNotification(null), 4000);
  };

  // Upload Handlers
  const handleUploadBOM = async (file: File) => {
    try {
      const parsed = await parseUploadedFile(file);
      const mapped = mapToBOMSource(parsed.rows, parsed.fileName);
      if (mapped.data.length > 0) {
        setBomSource(mapped.data);
        setBomFileName(file.name);
        notify(`✓ Loaded ${mapped.data.length} BOM lines from "${file.name}"`);
      } else {
        notify(`⚠️ Could not parse records from "${file.name}". Please check columns.`);
      }
    } catch (err: any) {
      notify(`❌ Error reading file: ${err.message}`);
    }
  };

  const handleUploadSchedule = async (file: File) => {
    try {
      const parsed = await parseUploadedFile(file);
      const mapped = mapToBuildSchedule(parsed.rows, parsed.fileName);
      if (mapped.data.length > 0) {
        setBuildSchedule(mapped.data);
        setScheduleFileName(file.name);
        notify(`✓ Loaded ${mapped.data.length} build schedule rows from "${file.name}"`);
      } else {
        notify(`⚠️ Could not parse build schedule from "${file.name}".`);
      }
    } catch (err: any) {
      notify(`❌ Error reading schedule: ${err.message}`);
    }
  };

  const handleUploadInventory = async (file: File) => {
    try {
      const parsed = await parseUploadedFile(file);
      const mapped = mapToInventory(parsed.rows, parsed.fileName);
      if (mapped.data.length > 0) {
        setInventory(mapped.data);
        setInventoryFileName(file.name);
        notify(`✓ Loaded ${mapped.data.length} inventory items from "${file.name}"`);
      } else {
        notify(`⚠️ Could not parse inventory from "${file.name}".`);
      }
    } catch (err: any) {
      notify(`❌ Error reading inventory: ${err.message}`);
    }
  };

  const handleApplyPastedSchedule = (newSchedule: BuildScheduleRecord[]) => {
    setBuildSchedule(newSchedule);
    setScheduleFileName(`Pasted_Excel_Schedule_${newSchedule.length}_Items.xlsx`);
    notify(`✓ Successfully applied ${newSchedule.length} parent items from Excel clipboard.`);
  };

  const handleRunExplosion = () => {
    setIsRecalculating(true);
    setManualTriggerCount((c) => c + 1);
    setTimeout(() => setIsRecalculating(false), 80);
    notify(`✓ BOM Explosion re-evaluated in ${explosionResult.executionTimeMs}ms`);
  };

  // Preset Dataset Switcher
  const handleLoadSample = (datasetKey: 'powerquery' | 'multilevel' | 'scale1000') => {
    if (datasetKey === 'powerquery') {
      setBomSource(SAMPLE_POWER_QUERY_BOM);
      setBuildSchedule(SAMPLE_POWER_QUERY_BUILD_SCHEDULE);
      setInventory(SAMPLE_INVENTORY);
      setMode('POWER_QUERY_3_LEVEL');
      setBomFileName('BOM_Source_Default.csv');
      setScheduleFileName('Build_Qty_Excel_Image1.xlsx');
      setInventoryFileName('Inventory_Stock.xlsx');
      notify('Loaded Default BOM Source & Image 1 Schedule (31 Parents)');
    } else if (datasetKey === 'multilevel') {
      setBomSource(SAMPLE_MULTI_LEVEL_BOM);
      setBuildSchedule(SAMPLE_MULTI_LEVEL_BUILD_SCHEDULE);
      setInventory(SAMPLE_MULTI_LEVEL_INVENTORY);
      setMode('MULTI_LEVEL_RECURSIVE');
      setBomFileName('Autonomous_Drone_5Level_BOM.xlsx');
      setScheduleFileName('Drone_Q4_Build_Schedule.xlsx');
      setInventoryFileName('Drone_Parts_Inventory.xlsx');
      notify('Loaded Multi-Level Hierarchical Drone & Robotics System (5 Levels Deep)');
    } else if (datasetKey === 'scale1000') {
      const dataset = generateHighVolumeDataset();
      setBomSource(dataset.bomSource);
      setBuildSchedule(dataset.buildSchedule);
      setInventory(dataset.inventory);
      setMode('POWER_QUERY_3_LEVEL');
      setBomFileName('Scale_1000_Industrial_BOM.xlsx');
      setScheduleFileName('Scale_Build_Orders.xlsx');
      setInventoryFileName('Scale_Stock.xlsx');
      notify(`Loaded High-Volume Simulation (${dataset.bomSource.length} BOM records exploded in sub-milliseconds)`);
    }
  };

  const handleExportExcel = () => {
    exportToExcel({
      explodedRows: explosionResult.explodedRows,
      componentSummaries: explosionResult.componentSummaries,
      buildSchedule,
      bomSource,
      fileName: `BOM_MRP_Explosion_${mode}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
    notify('✓ Complete multi-tab Excel workbook generated and downloaded.');
  };

  const handleClearSaved = () => {
    clearPersistedState();
    setBomSource(SAMPLE_POWER_QUERY_BOM);
    setBuildSchedule(SAMPLE_POWER_QUERY_BUILD_SCHEDULE);
    setInventory(getInitialOnHandInventory());
    setBomFileName('BOM_Source_Default.csv');
    setScheduleFileName('Build_Qty_Excel_Pasted.xlsx');
    setInventoryFileName('Stock_On_Hand.csv');
    setMode('POWER_QUERY_3_LEVEL');
    setLastSavedAt(null);
    notify('✓ Reset to initial default sample dataset and cleared saved cache.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Application Bar */}
      <Header
        mode={mode}
        onModeChange={setMode}
        onLoadSample={handleLoadSample}
        onExportExcel={handleExportExcel}
        onDownloadTemplate={downloadStarterTemplate}
        isRecalculating={isRecalculating}
        executionTimeMs={explosionResult.executionTimeMs}
        totalItemsExploded={explosionResult.explodedRows.length}
        hasShortages={explosionResult.shortageCount > 0}
        lastSavedAt={lastSavedAt}
        onClearSavedData={handleClearSaved}
      />

      {/* Upload Notification Toast */}
      {uploadNotification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-3">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in font-medium">
            <span>{uploadNotification}</span>
            <button
              type="button"
              onClick={() => setUploadNotification(null)}
              className="text-indigo-500 hover:text-indigo-900 font-bold text-base ml-2 leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Upload & Ingestion Section */}
        <UploadSection
          bomSource={bomSource}
          buildSchedule={buildSchedule}
          inventory={inventory}
          bomFileName={bomFileName}
          scheduleFileName={scheduleFileName}
          inventoryFileName={inventoryFileName}
          onUploadBOM={handleUploadBOM}
          onUploadSchedule={handleUploadSchedule}
          onUploadInventory={handleUploadInventory}
          onRunExplosion={handleRunExplosion}
          isAutoExplode={isAutoExplode}
          onToggleAutoExplode={setIsAutoExplode}
          defaultBuildQty={defaultBuildQty}
          onChangeDefaultBuildQty={setDefaultBuildQty}
          onResetToDemo={() => handleLoadSample('powerquery')}
          onOpenPasteModal={() => setShowPasteModal(true)}
        />

        {/* Executive Metrics Bar */}
        <KpiSummary
          result={explosionResult}
          buildSchedule={buildSchedule}
        />

        {/* View Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap items-center space-x-1.5 sm:space-x-2 text-xs">
            {/* 1. Output Breakdown Table (Primary View) */}
            <button
              id="tab-breakdown"
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition ${
                activeTab === 'breakdown'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Output Table (Item · Qty)</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'breakdown' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {explosionResult.explodedRows.length}
              </span>
            </button>

            {/* 2. Subassemblies to Make */}
            <button
              id="tab-subs"
              type="button"
              onClick={() => setActiveTab('subs')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition ${
                activeTab === 'subs'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Subassemblies to Make</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'subs' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {explosionResult.subassembliesToMake.length}
              </span>
            </button>

            {/* 3. Hierarchical Tree */}
            <button
              id="tab-tree"
              type="button"
              onClick={() => setActiveTab('tree')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition ${
                activeTab === 'tree'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hierarchical Tree</span>
            </button>

            {/* 4. BOM Source Inspector */}
            <button
              id="tab-bomsource"
              type="button"
              onClick={() => setActiveTab('bomSource')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-semibold transition ${
                activeTab === 'bomSource'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>BOM Source Inspector</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'bomSource' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {bomSource.length}
              </span>
            </button>
          </div>

          {/* Quick Action: Quick Paste Schedule */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-lg text-xs font-bold border border-emerald-300 shadow-2xs transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paste Excel Schedule</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'breakdown' && (
          <ParentBreakdownTable
            explodedRows={explosionResult.explodedRows}
            buildSchedule={buildSchedule}
            onUpdateSchedule={setBuildSchedule}
            qtyOverrides={qtyOverrides}
            onUpdateQtyOverride={handleUpdateQtyOverride}
            deletedRowKeys={deletedRowKeys}
            onDeleteRowKey={handleDeleteRowKey}
            onDeleteRowKeys={handleDeleteRowKeys}
            onResetCustomizations={handleResetCustomizations}
          />
        )}

        {activeTab === 'subs' && (
          <SubassembliesToMakeView
            subassemblies={explosionResult.subassembliesToMake}
            onOpenPasteModal={() => setShowPasteModal(true)}
          />
        )}

        {activeTab === 'tree' && (
          <HierarchicalTreeView
            bomSource={bomSource}
            buildSchedule={buildSchedule}
            componentSummaries={explosionResult.componentSummaries}
            defaultBuildQty={defaultBuildQty}
          />
        )}

        {activeTab === 'bomSource' && (
          <BOMSourceInspector
            bomSource={bomSource}
            onUpdateBOM={setBomSource}
          />
        )}
      </main>

      {/* Excel Paste Modal */}
      <ExcelPasteModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        bomSource={bomSource}
        onApplySchedule={handleApplyPastedSchedule}
      />

      {/* Footer with Business Logic Reference */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Power Query BOM Rules:</span>
            <span>If Level 3 is blank → Comp = L2, Final Qty = L2 Qty; Else Comp = L3, Final Qty = L2 Qty × L3 Qty; Total = Final Qty × Build Qty.</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Fast Reactive Engine</span>
            <span>•</span>
            <span>Subassembly Production Planning</span>
            <span>•</span>
            <span>Export to Excel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
