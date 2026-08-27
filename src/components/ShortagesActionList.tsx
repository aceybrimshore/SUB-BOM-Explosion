import React from 'react';
import { AlertOctagon, Download, DollarSign, Clock, ShieldAlert, Layers } from 'lucide-react';
import { ComponentDemandSummary } from '../types/bom';
import { exportTableToCSV } from '../utils/exporter';

interface ShortagesActionListProps {
  summaries: ComponentDemandSummary[];
  onClose: () => void;
}

export const ShortagesActionList: React.FC<ShortagesActionListProps> = ({
  summaries,
  onClose,
}) => {
  const shortages = summaries.filter((s) => s.status === 'SHORTAGE');
  const lowStock = summaries.filter((s) => s.status === 'LOW_STOCK');

  const totalShortageCost = shortages.reduce(
    (acc, s) => acc + s.netShortage * (s.unitCost || 0),
    0
  );

  const handleExportShortages = () => {
    const data = shortages.map((s) => ({
      Component: s.component,
      Description: s.description,
      'Gross Demand': s.totalGrossDemand,
      'On Hand': s.onHand,
      'Safety Stock': s.safetyStock,
      'Net Shortage To Order': s.netShortage,
      'Unit Cost': s.unitCost,
      'Total Value ($)': s.netShortage * s.unitCost,
      'Lead Time (Days)': s.leadTimeDays,
      'Affected Parent Assemblies': s.usedIn.map((u) => `${u.parent} (Demand: ${u.totalRequired})`).join(', '),
    }));
    exportTableToCSV(data, `Critical_Shortages_Action_Plan_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Material Shortages & Procurement Action List</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-100 text-rose-700 border border-rose-200 font-bold">
                  {shortages.length} Shortages
                </span>
              </h2>
              <p className="text-xs text-rose-700/80">
                Items requiring immediate purchase order placement to meet production build schedule.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportShortages}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Shortages CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Shortage Summary Cards */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Total Purchase Exposure</span>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
              ${totalShortageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Max Lead Time Risk</span>
            <div className="text-xl font-bold font-mono text-amber-600 mt-1">
              {shortages.length > 0
                ? `${Math.max(...shortages.map((s) => s.leadTimeDays))} Days`
                : '0 Days'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Low Buffer SKUs</span>
            <div className="text-xl font-bold font-mono text-amber-600 mt-1">
              {lowStock.length} SKUs
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/30">
          {shortages.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              🎉 No component shortages found! Current on-hand inventory fully satisfies all planned build schedules.
            </div>
          ) : (
            shortages.map((item) => (
              <div
                key={item.component}
                className="bg-white border border-rose-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-rose-300 transition shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{item.component}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                      Need +{item.netShortage.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono mt-2">
                    <span>Demand: <strong className="text-slate-900">{item.totalGrossDemand}</strong></span>
                    <span>On-Hand: <strong className="text-slate-700">{item.onHand}</strong></span>
                    <span>Buffer: <strong className="text-slate-700">{item.safetyStock}</strong></span>
                    <span>Lead Time: <strong className="text-amber-600">{item.leadTimeDays}d</strong></span>
                    <span>Unit Cost: <strong className="text-slate-800">${item.unitCost}</strong></span>
                  </div>
                </div>

                {/* Used In Parents Tag */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 min-w-[220px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Affects {item.usedIn.length} Build Schedules:
                  </span>
                  <div className="space-y-1">
                    {item.usedIn.map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-indigo-600 font-semibold">{u.parent}</span>
                        <span className="text-slate-500">Needs {u.totalRequired}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
