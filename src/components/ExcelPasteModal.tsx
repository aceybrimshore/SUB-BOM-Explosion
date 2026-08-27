import React, { useState, useMemo } from 'react';
import {
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  ArrowRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BuildScheduleRecord, BOMRawRecord } from '../types/bom';

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bomSource: BOMRawRecord[];
  onApplySchedule: (schedule: BuildScheduleRecord[]) => void;
}

export const ExcelPasteModal: React.FC<ExcelPasteModalProps> = ({
  isOpen,
  onClose,
  bomSource,
  onApplySchedule,
}) => {
  const [rawText, setRawText] = useState('');

  // Set of known parent SKUs in BOM Source
  const knownParents = useMemo(() => {
    const set = new Set<string>();
    bomSource.forEach((b) => {
      const p = (b.level1 || b.parent || '').trim();
      if (p) set.add(p);
    });
    return set;
  }, [bomSource]);

  // Parse raw text into structured records
  const parsedRows = useMemo(() => {
    if (!rawText.trim()) return [];

    const lines = rawText.trim().split(/\r?\n/);
    const results: Array<{
      parent: string;
      buildQty: number;
      workOrder: string;
      isKnown: boolean;
      originalLine: string;
    }> = [];

    const headerKeywords = ['location', 'product', 'parent', 'sku', 'assembly', 'level 1', 'level1', 'build qty', 'qty', 'quantity', 'build_qty', 'internal id', 'unitstoproduce', 'sum of'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tab (Excel standard), comma, or multiple spaces
      let parts = line.includes('\t')
        ? line.split('\t')
        : line.includes(',')
        ? line.split(',')
        : line.split(/\s{2,}|\s+/);

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      // Check if line is a header row
      const lineLower = line.toLowerCase();
      const isHeader = headerKeywords.some((k) => lineLower.includes(k));
      if (isHeader && i === 0) continue;

      let parent = parts[0] || '';
      let qty = 1;
      let wo = '';

      if (parts.length >= 4) {
        const num3 = parseFloat(parts[2].replace(/,/g, ''));
        const num4 = parseFloat(parts[3].replace(/,/g, ''));

        // If 3rd col (Internal ID) & 4th col (UnitsToProduce) are numeric:
        // Col A = Location, Col B = Product, Col C = Internal ID, Col D = UnitsToProduce
        if (!isNaN(num3) && !isNaN(num4)) {
          parent = parts[1];
          wo = parts[2];
          qty = num4;
        } else {
          parent = parts[0];
          const num2 = parseFloat(parts[1].replace(/,/g, ''));
          if (!isNaN(num3)) {
            qty = num3;
            wo = parts[1];
          } else if (!isNaN(num2)) {
            qty = num2;
            wo = parts[2];
          }
        }
      } else if (parts.length === 3) {
        const num3 = parseFloat(parts[2].replace(/,/g, ''));
        const num2 = parseFloat(parts[1].replace(/,/g, ''));

        if (!isNaN(num3)) {
          // Col A = Product, Col B = Internal ID, Col C = UnitsToProduce
          parent = parts[0];
          qty = num3;
          wo = parts[1];
        } else if (!isNaN(num2)) {
          parent = parts[0];
          qty = num2;
          wo = parts[2];
        }
      } else if (parts.length === 2) {
        parent = parts[0];
        const num2 = parseFloat(parts[1].replace(/,/g, ''));
        if (!isNaN(num2)) {
          qty = num2;
        } else {
          wo = parts[1];
        }
      }

      if (parent) {
        results.push({
          parent,
          buildQty: Math.max(0, qty),
          workOrder: wo || `ID-${parent.slice(0, 4)}-${i + 1}`,
          isKnown: knownParents.has(parent),
          originalLine: line,
        });
      }
    }

    return results;
  }, [rawText, knownParents]);

  const totalBuildUnits = useMemo(() => {
    return parsedRows.reduce((acc, r) => acc + r.buildQty, 0);
  }, [parsedRows]);

  const matchedCount = useMemo(() => {
    return parsedRows.filter((r) => r.isKnown).length;
  }, [parsedRows]);

  const handleApply = () => {
    if (parsedRows.length === 0) return;

    const newSchedule: BuildScheduleRecord[] = parsedRows.map((r, idx) => ({
      id: `sched-paste-${Date.now()}-${idx}`,
      parent: r.parent,
      buildQty: r.buildQty,
      workOrder: r.workOrder,
      dueDate: new Date().toISOString().slice(0, 10),
    }));

    onApplySchedule(newSchedule);
    onClose();
  };

  const handleLoadImage1Sample = () => {
    const samplePaste = `RLKVA	192
SUB0798	300
RCP58-BK	400
PZQ3060070	20
2HJ-071-126	31
RCH6	192
RLTF	192
N003-BP	500
BC3-150	220
LR1020	1
SX022	80
B120010-BP	10
DK519	240
RTS518	40
RL150S10	240
CXB	40
RTS542	63
SP329	50
S606	144
5867633290	5
DK088	5
DK137	8
DK330R	4
DK520F	6
PZQ306036A	1
PZQ306036B	1
RB1120B	17
RLKS3	38
RLTFHIF/M	12
RRM16	5
SP320	5`;
    setRawText(samplePaste);
  };

  const handleLoad3ColumnSample = () => {
    const sample3Col = `710-RSL-00005	149525	3
CADDY04	18155	20
CSL26M	66678	25
CSL30M	66680	25
CSL35M	66679	50
MS40M	66689	30
PZQ3060071	18426	84
PZQ3060150	18429	20
PZQ3075060	18452	30
RVP81	50723	3
SX021	8604	50
VN1WZ9955106F	171533	32`;
    setRawText(sample3Col);
  };

  const handleLoadFullReportSample = () => {
    const fullReportSample = `location	product	Sum of Internal ID	Sum of UnitsToProduce	Sum of min_order_qty	Sum of stock_on_hand
Sydney	710-RSL-00005	149525	3	0	8
Sydney	CADDY04	18155	20	20	2
Sydney	CSL26M	66678	25	25	4
Sydney	CSL30M	66680	25	25	0
Sydney	CSL35M	66679	50	25	0
Sydney	MS40M	66689	30	10	0
Sydney	PZQ3060071	18426	84	84	0
Sydney	PZQ3060150	18429	20	20	0
Sydney	PZQ3075060	18452	30	15	0
Sydney	RVP81	50723	3	1	0
Sydney	SX021	8604	50	50	0
Sydney	VN1WZ9955106F	171533	32	0	0`;
    setRawText(fullReportSample);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Paste Excel / CSV Build Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Supports pasting <span className="font-semibold text-slate-700">Columns B, C, D</span> (Product, Internal ID, Units to Produce) or full CSV report tables directly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick instructions & Sample buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Clipboard Paste Area (Tab, Comma, or CSV Format):
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleLoadFullReportSample}
                className="inline-flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Load CSV Report Sample (Cols A-D+)</span>
              </button>
              <button
                type="button"
                onClick={handleLoad3ColumnSample}
                className="inline-flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-900 font-semibold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Cols B,C,D Sample</span>
              </button>
              <button
                type="button"
                onClick={handleLoadImage1Sample}
                className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>2-Col Sample</span>
              </button>
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-xs text-slate-400 hover:text-rose-600 font-medium transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Supported Formats:\n1) Parent Assembly [tab] Build Qty\n   2HJ-071-126\t31\n\n2) Parent Assembly [tab] Internal ID [tab] Build Qty\n   710-RSL-00005\t149525\t3\n   CADDY04\t18155\t20`}
            rows={7}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />

          {/* Real-time Parsed Statistics */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Rows Detected</div>
                  <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                    {parsedRows.length}
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-emerald-700 font-medium">Matched in BOM</div>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                    {matchedCount} / {parsedRows.length}
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-indigo-700 font-medium">Total Build Units</div>
                  <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                    {totalBuildUnits.toLocaleString()} EA
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Parsed Schedule Preview ({parsedRows.length} Parents)</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Matches BOM Source Level 1
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {parsedRows.slice(0, 15).map((r, i) => (
                    <div
                      key={i}
                      className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-[10px] w-5">{i + 1}.</span>
                        <span className="font-bold text-slate-800">{r.parent}</span>
                        {r.workOrder && (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-sans border border-slate-200">
                            Internal ID: {r.workOrder}
                          </span>
                        )}
                        {r.isKnown ? (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-sans font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>In BOM</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-sans font-medium flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>New SKU</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-indigo-600 font-bold">
                          {r.buildQty.toLocaleString()} EA
                        </span>
                      </div>
                    </div>
                  ))}
                  {parsedRows.length > 15 && (
                    <div className="px-3.5 py-2 text-center text-xs text-slate-500 bg-slate-50 font-sans">
                      ...and {parsedRows.length - 15} more rows
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleApply}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <span>Apply Schedule & Explode BOM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
