import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Sliders,
  RefreshCw,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  ClipboardPaste,
  Wrench,
} from 'lucide-react';
import { BuildScheduleRecord, BOMRawRecord } from '../types/bom';

interface BuildSchedulePlannerProps {
  buildSchedule: BuildScheduleRecord[];
  bomSource: BOMRawRecord[];
  onUpdateSchedule: (schedule: BuildScheduleRecord[]) => void;
  onRunExplosion: () => void;
  onOpenPasteModal?: () => void;
}

export const BuildSchedulePlanner: React.FC<BuildSchedulePlannerProps> = ({
  buildSchedule,
  bomSource,
  onUpdateSchedule,
  onRunExplosion,
  onOpenPasteModal,
}) => {
  const [newParent, setNewParent] = useState('');
  const [newQty, setNewQty] = useState<number>(10);
  const [newWorkOrder, setNewWorkOrder] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Extract all available parents from BOM source for quick autocomplete/selection
  const availableParents = React.useMemo(() => {
    const set = new Set<string>();
    bomSource.forEach((b) => {
      const l1 = b.level1 || b.parent;
      if (l1) set.add(l1.trim());
    });
    return Array.from(set).sort();
  }, [bomSource]);

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...buildSchedule];
    updated[index] = {
      ...updated[index],
      buildQty: Math.max(0, val),
    };
    onUpdateSchedule(updated);
  };

  const handleWorkOrderChange = (index: number, val: string) => {
    const updated = [...buildSchedule];
    updated[index] = {
      ...updated[index],
      workOrder: val,
    };
    onUpdateSchedule(updated);
  };

  const handleDelete = (index: number) => {
    const updated = buildSchedule.filter((_, i) => i !== index);
    onUpdateSchedule(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParent.trim()) return;

    const newRecord: BuildScheduleRecord = {
      id: `build-sched-${Date.now()}`,
      parent: newParent.trim(),
      buildQty: Number(newQty) || 1,
      workOrder: newWorkOrder.trim() || `WO-${Date.now().toString().slice(-4)}`,
      dueDate: newDueDate || new Date().toISOString().slice(0, 10),
    };

    onUpdateSchedule([...buildSchedule, newRecord]);
    setNewParent('');
    setNewQty(10);
    setNewWorkOrder('');
    setNewDueDate('');
  };

  const handleBatchScale = (multiplier: number) => {
    const updated = buildSchedule.map((b) => ({
      ...b,
      buildQty: Math.max(1, Math.round(b.buildQty * multiplier)),
    }));
    onUpdateSchedule(updated);
  };

  const totalBuildUnits = buildSchedule.reduce((acc, b) => acc + (Number(b.buildQty) || 0), 0);

  return (
    <div id="build-schedule-planner-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Interactive Build Schedule & What-If Planner</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              {totalBuildUnits.toLocaleString()} Planned Assemblies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify build targets and test production scaling scenarios. BOM explosion recalculates instantly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Paste from Excel button */}
          {onOpenPasteModal && (
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from Excel</span>
            </button>
          )}

          {/* Quick Batch Scaling Buttons */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-1 rounded-lg text-xs">
            <span className="text-slate-500 px-1 text-[11px] font-medium">Scale:</span>
            <button
              type="button"
              onClick={() => handleBatchScale(0.5)}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs transition font-semibold"
              title="Scale all build quantities by 0.5x"
            >
              0.5x
            </button>
            <button
              type="button"
              onClick={() => handleBatchScale(1.5)}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs transition font-semibold"
              title="Scale all build quantities by 1.5x"
            >
              1.5x
            </button>
            <button
              type="button"
              onClick={() => handleBatchScale(2)}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition shadow-2xs"
              title="Double all build quantities"
            >
              2x
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Planned Parents */}
      <div className="p-4 bg-slate-50/40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {buildSchedule.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-indigo-600 truncate" title={item.parent}>
                    {item.parent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Remove from build schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                  <input
                    type="text"
                    placeholder="Internal ID"
                    value={item.workOrder || ''}
                    onChange={(e) => handleWorkOrderChange(idx, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <span>Due: {item.dueDate || 'Immediate'}</span>
                </div>
              </div>

              {/* Quantity Stepper & Direct Input */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Build Quantity:</span>
                <div className="flex items-center space-x-1 font-mono">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(idx, Math.max(0, item.buildQty - 5))}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-200 transition"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(idx, Math.max(0, item.buildQty - 1))}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-200 transition"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={item.buildQty}
                    onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 0)}
                    className="w-16 bg-white text-slate-900 px-2 py-1 rounded border border-slate-200 text-center font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(idx, item.buildQty + 1)}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-200 transition"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(idx, item.buildQty + 5)}
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs flex items-center justify-center font-bold border border-slate-200 transition"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Parent Form */}
        <form onSubmit={handleAdd} className="mt-4 p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add Assembly:</span>
          </div>

          {/* Autocomplete / Select Parent */}
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              list="parent-options"
              placeholder="Select or enter Parent Assembly SKU..."
              value={newParent}
              onChange={(e) => setNewParent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <datalist id="parent-options">
              {availableParents.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 font-medium">Qty:</span>
            <input
              type="number"
              min="1"
              max="100000"
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
              className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <input
              type="text"
              placeholder="Internal ID (opt)"
              value={newWorkOrder}
              onChange={(e) => setNewWorkOrder(e.target.value)}
              className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Parent</span>
          </button>
        </form>
      </div>
    </div>
  );
};
