import React, { useState, useEffect } from 'react';
import { Columns, Check, AlertCircle, X, ArrowRight, Table2 } from 'lucide-react';
import { ColumnMappingConfig, BuildScheduleRecord } from '../types/bom';
import { mapToBuildSchedule } from '../utils/fileParser';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawRows: any[];
  fileName: string;
  headers: string[];
  initialMapping?: ColumnMappingConfig;
  onApplyMapping: (records: BuildScheduleRecord[], mapping: ColumnMappingConfig) => void;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  rawRows,
  fileName,
  headers,
  initialMapping,
  onApplyMapping,
}) => {
  const [parentCol, setParentCol] = useState<string>(initialMapping?.parentCol || '');
  const [qtyCol, setQtyCol] = useState<string>(initialMapping?.qtyCol || '');
  const [workOrderCol, setWorkOrderCol] = useState<string>(initialMapping?.workOrderCol || '');
  const [dueDateCol, setDueDateCol] = useState<string>(initialMapping?.dueDateCol || '');

  // When initialMapping or headers change, sync state
  useEffect(() => {
    if (initialMapping?.parentCol) setParentCol(initialMapping.parentCol);
    if (initialMapping?.qtyCol) setQtyCol(initialMapping.qtyCol);
    if (initialMapping?.workOrderCol) setWorkOrderCol(initialMapping.workOrderCol);
    if (initialMapping?.dueDateCol) setDueDateCol(initialMapping.dueDateCol);
  }, [initialMapping, headers]);

  if (!isOpen || !rawRows || rawRows.length === 0) return null;

  const handleApply = () => {
    const config: ColumnMappingConfig = {
      parentCol: parentCol || undefined,
      qtyCol: qtyCol || undefined,
      workOrderCol: workOrderCol || undefined,
      dueDateCol: dueDateCol || undefined,
    };
    const parsed = mapToBuildSchedule(rawRows, fileName, config);
    onApplyMapping(parsed.data, config);
    onClose();
  };

  const getColLetter = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  // Preview the first 5 rows
  const previewRows = rawRows.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configure CSV / Excel Column Mapping
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting file: <span className="font-semibold text-slate-700">{fileName}</span> ({rawRows.length} total rows)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50/80 border-b border-blue-100 flex items-center space-x-2 text-xs text-blue-800">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Smart Auto-Detection:</strong> Supports standard production schedules and NetSuite Back Order CSVs where <strong>Column B is Item / SKU</strong> and <strong>Column F is Quantity</strong>.
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Column Selectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Item / Parent Assembly */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Item / Assembly SKU <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentCol}
                onChange={(e) => setParentCol(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {headers.map((h, idx) => (
                  <option key={h + idx} value={h}>
                    Col {getColLetter(idx)}: {h}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                e.g. Column B ("SKU", "Item")
              </p>
            </div>

            {/* Build Quantity */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Build Qty / Demand <span className="text-rose-500">*</span>
              </label>
              <select
                value={qtyCol}
                onChange={(e) => setQtyCol(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {headers.map((h, idx) => (
                  <option key={h + idx} value={h}>
                    Col {getColLetter(idx)}: {h}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                e.g. Column F ("Back Order", "Qty")
              </p>
            </div>

            {/* Work Order / Document # */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Work Order / Doc # <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={workOrderCol}
                onChange={(e) => setWorkOrderCol(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- None --</option>
                {headers.map((h, idx) => (
                  <option key={h + idx} value={h}>
                    Col {getColLetter(idx)}: {h}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                e.g. Column C ("Document Number")
              </p>
            </div>

            {/* Due Date */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                4. Required / Due Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={dueDateCol}
                onChange={(e) => setDueDateCol(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- None --</option>
                {headers.map((h, idx) => (
                  <option key={h + idx} value={h}>
                    Col {getColLetter(idx)}: {h}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                e.g. Column G ("Required Date")
              </p>
            </div>
          </div>

          {/* Table Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Table2 className="w-4 h-4 text-slate-500" />
                <span>Uploaded Data Preview (First 5 Rows):</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Scroll horizontally to view all columns
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56 bg-slate-50/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3 border-r border-slate-200 whitespace-nowrap text-center w-12">#</th>
                    {headers.map((h, idx) => {
                      const letter = getColLetter(idx);
                      const isParent = h === parentCol;
                      const isQty = h === qtyCol;
                      const isWO = h === workOrderCol;
                      const isDue = h === dueDateCol;

                      return (
                        <th
                          key={h + idx}
                          className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                            isParent
                              ? 'bg-blue-100 text-blue-900'
                              : isQty
                              ? 'bg-emerald-100 text-emerald-900'
                              : isWO
                              ? 'bg-purple-100 text-purple-900'
                              : isDue
                              ? 'bg-amber-100 text-amber-900'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-black/10 font-bold">
                              Col {letter}
                            </span>
                            <span>{h}</span>
                          </div>
                          {(isParent || isQty || isWO || isDue) && (
                            <div className="mt-1">
                              {isParent && (
                                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-600 text-white">
                                  ITEM / SKU
                                </span>
                              )}
                              {isQty && (
                                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                                  BUILD QTY
                                </span>
                              )}
                              {isWO && (
                                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-600 text-white">
                                  DOC # / WO
                                </span>
                              )}
                              {isDue && (
                                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-600 text-white">
                                  DUE DATE
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200 bg-slate-50">
                        {rIdx + 1}
                      </td>
                      {headers.map((h, cIdx) => {
                        const isParent = h === parentCol;
                        const isQty = h === qtyCol;
                        const isWO = h === workOrderCol;
                        const isDue = h === dueDateCol;
                        const val = row[h];

                        return (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 border-r border-slate-100 whitespace-nowrap text-slate-800 ${
                              isParent
                                ? 'bg-blue-50/60 font-semibold font-mono text-blue-900'
                                : isQty
                                ? 'bg-emerald-50/60 font-bold font-mono text-emerald-900'
                                : isWO
                                ? 'bg-purple-50/50 font-mono text-purple-900'
                                : isDue
                                ? 'bg-amber-50/50 text-amber-900'
                                : ''
                            }`}
                          >
                            {val !== undefined && val !== null ? String(val) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parentCol && qtyCol ? (
              <span className="text-emerald-700 font-medium flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Ready: Col {parentCol} (Item) → Col {qtyCol} (Qty)</span>
              </span>
            ) : (
              <span className="text-amber-600 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Please select both Item and Qty columns</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parentCol || !qtyCol}
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <span>Apply Mapping & Explode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
