import React from 'react';
import { AlertOctagon, CheckCircle2, GitFork, Layers, AlertCircle, ShoppingCart, Zap } from 'lucide-react';
import { ExplosionResult, BuildScheduleRecord } from '../types/bom';

interface KpiSummaryProps {
  result: ExplosionResult;
  buildSchedule?: BuildScheduleRecord[];
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  result,
  buildSchedule = [],
}) => {
  const {
    explodedRows,
    circularReferences,
    executionTimeMs,
  } = result;

  const totalGrossUnits = explodedRows.reduce((acc, r) => acc + r.totalRequired, 0);
  const scheduledParentsCount = buildSchedule.length;

  const inStockRows = explodedRows.filter((r) => r.raiseDecision === 'IN_STOCK');
  const partsToRaiseRows = explodedRows.filter((r) => r.raiseDecision && r.raiseDecision !== 'IN_STOCK');
  const totalRaiseQty = partsToRaiseRows.reduce((acc, r) => acc + (r.raiseQty ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Circular Reference Warning if any */}
      {circularReferences.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start space-x-3 text-amber-900 text-xs shadow-xs">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">Circular Dependency Warning: </span>
            <span className="text-amber-800">BOM hierarchy loops were detected and safely halted:</span>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-amber-800 font-mono">
              {circularReferences.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Clean Metrics Bar with Stock & Parts-to-Raise Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Scheduled Assemblies */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Parents
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-slate-800 font-mono">
                {scheduledParentsCount > 0 ? scheduledParentsCount : 'All BOM'}
              </span>
              <span className="text-xs text-slate-500 font-medium">assemblies</span>
            </div>
          </div>
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* 2. Total Exploded Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Output Lines
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-slate-800 font-mono">
                {explodedRows.length.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">parts</span>
            </div>
          </div>
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <GitFork className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Total Required Qty */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Required Qty
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-slate-800 font-mono">
                {totalGrossUnits.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">units</span>
            </div>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* 4. Fully In Stock */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Fully In Stock
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-emerald-600 font-mono">
                {inStockRows.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">parts ready</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* 5. Parts To Raise (Need Purchasing/Raising) */}
        <div className={`bg-white border rounded-xl p-3.5 shadow-2xs flex items-center justify-between ${
          partsToRaiseRows.length > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Parts to Raise
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className={`text-xl font-bold font-mono ${partsToRaiseRows.length > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {partsToRaiseRows.length}
              </span>
              <span className="text-xs text-amber-800 font-semibold">({totalRaiseQty.toLocaleString()} units)</span>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${partsToRaiseRows.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

