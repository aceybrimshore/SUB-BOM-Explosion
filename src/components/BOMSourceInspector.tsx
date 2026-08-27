import React, { useState, useMemo } from 'react';
import { Search, Download, Plus, Trash2, Edit2, Layers, Check, X } from 'lucide-react';
import { BOMRawRecord } from '../types/bom';
import { exportTableToCSV } from '../utils/exporter';

interface BOMSourceInspectorProps {
  bomSource: BOMRawRecord[];
  onUpdateBOM: (updated: BOMRawRecord[]) => void;
}

export const BOMSourceInspector: React.FC<BOMSourceInspectorProps> = ({
  bomSource,
  onUpdateBOM,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BOMRawRecord>>({});

  // New Row Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newL1, setNewL1] = useState('');
  const [newL2, setNewL2] = useState('');
  const [newL2Qty, setNewL2Qty] = useState<number>(1);
  const [newL3, setNewL3] = useState('');
  const [newL3Qty, setNewL3Qty] = useState<number>(0);
  const [newDesc, setNewDesc] = useState('');

  const filteredData = useMemo(() => {
    return bomSource.filter((row) => {
      const searchLower = searchTerm.toLowerCase();
      const l1 = (row.level1 || row.parent || '').toLowerCase();
      const l2 = (row.level2 || row.component || '').toLowerCase();
      const l3 = (row.level3 || '').toLowerCase();
      const desc = (row.description || '').toLowerCase();

      return (
        !searchTerm ||
        l1.includes(searchLower) ||
        l2.includes(searchLower) ||
        l3.includes(searchLower) ||
        desc.includes(searchLower)
      );
    });
  }, [bomSource, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const startEdit = (row: BOMRawRecord) => {
    setEditingId(row.id || '');
    setEditData({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = (indexInSource: number) => {
    const updated = [...bomSource];
    updated[indexInSource] = {
      ...updated[indexInSource],
      ...editData,
    };
    onUpdateBOM(updated);
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (index: number) => {
    const updated = bomSource.filter((_, i) => i !== index);
    onUpdateBOM(updated);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newL1.trim() || !newL2.trim()) return;

    const newRecord: BOMRawRecord = {
      id: `bom-manual-${Date.now()}`,
      level1: newL1.trim(),
      level2: newL2.trim(),
      level2Qty: Number(newL2Qty) || 1,
      level3: newL3.trim(),
      level3Qty: newL3.trim() ? Number(newL3Qty) || 1 : 0,
      description: newDesc.trim(),
      parent: newL1.trim(),
      component: newL2.trim(),
      qty: Number(newL2Qty) || 1,
      unit: 'EA',
    };

    onUpdateBOM([newRecord, ...bomSource]);
    setNewL1('');
    setNewL2('');
    setNewL2Qty(1);
    setNewL3('');
    setNewL3Qty(0);
    setNewDesc('');
    setIsAdding(false);
  };

  const handleExportCSV = () => {
    const exportData = bomSource.map((b) => ({
      'Level 1': b.level1 || b.parent,
      'Level 2': b.level2 || b.component,
      'Level 2 Qty': b.level2Qty ?? b.qty ?? 1,
      'Level 3': b.level3 || '',
      'Level 3 Qty': b.level3Qty || '',
      'Description': b.description || '',
      'Unit': b.unit || 'EA',
    }));
    exportTableToCSV(exportData, `BOM_Source_Input_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div id="bom-source-inspector-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>BOM Source Raw Input Table</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
              {bomSource.length} raw BOM records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Columns: Level 1 (Parent Assembly), Level 2 (Subassembly/Component), Level 2 Qty, Level 3 (Sub-part), Level 3 Qty.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search BOM records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 lg:w-56"
            />
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Close Form' : 'Add BOM Line'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition hover:text-indigo-600"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Add Row Form Drawer */}
      {isAdding && (
        <form onSubmit={handleAddNew} className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">New BOM Record:</div>
          <input
            type="text"
            placeholder="Level 1 Parent (e.g. 710-RSL-00003)"
            value={newL1}
            onChange={(e) => setNewL1(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Level 2 Component (e.g. MS30M)"
            value={newL2}
            onChange={(e) => setNewL2(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            placeholder="L2 Qty"
            value={newL2Qty}
            onChange={(e) => setNewL2Qty(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-center w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
            required
          />
          <input
            type="text"
            placeholder="Level 3 (Optional subcomponent)"
            value={newL3}
            onChange={(e) => setNewL3(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 w-40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="L3 Qty"
            value={newL3Qty}
            onChange={(e) => setNewL3Qty(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-center w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 flex-1 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            Insert Line
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider select-none">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Level 1 (Parent Assembly)</th>
              <th className="py-3 px-3">Level 2 (Component / Subassy)</th>
              <th className="py-3 px-3 text-right">Level 2 Qty</th>
              <th className="py-3 px-3">Level 3 (Optional Sub-part)</th>
              <th className="py-3 px-3 text-right">Level 3 Qty</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No records found matching search query.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, pIdx) => {
                const globalIdx = (currentPage - 1) * pageSize + pIdx;
                const isEditing = editingId === (row.id || `bom-row-${globalIdx}`);

                if (isEditing) {
                  return (
                    <tr key={row.id || globalIdx} className="bg-slate-50">
                      <td className="py-2 px-3 text-slate-400">{globalIdx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editData.level1 ?? row.level1 ?? ''}
                          onChange={(e) => setEditData({ ...editData, level1: e.target.value })}
                          className="bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 w-full text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editData.level2 ?? row.level2 ?? ''}
                          onChange={(e) => setEditData({ ...editData, level2: e.target.value })}
                          className="bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 w-full text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={editData.level2Qty ?? row.level2Qty ?? 1}
                          onChange={(e) => setEditData({ ...editData, level2Qty: Number(e.target.value) })}
                          className="bg-white text-slate-900 px-1 py-0.5 rounded border border-slate-200 w-16 text-right text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editData.level3 ?? row.level3 ?? ''}
                          onChange={(e) => setEditData({ ...editData, level3: e.target.value })}
                          className="bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 w-full text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={editData.level3Qty ?? row.level3Qty ?? 0}
                          onChange={(e) => setEditData({ ...editData, level3Qty: Number(e.target.value) })}
                          className="bg-white text-slate-900 px-1 py-0.5 rounded border border-slate-200 w-16 text-right text-xs font-mono font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={editData.description ?? row.description ?? ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          className="bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200 w-full text-xs font-sans"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(globalIdx)}
                            className="p-1 text-emerald-600 hover:text-emerald-800"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id || globalIdx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-slate-400 font-sans">{globalIdx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">
                      {row.level1 || row.parent}
                    </td>
                    <td className="py-2 px-3 font-semibold text-indigo-600">
                      {row.level2 || row.component}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 font-medium">
                      {row.level2Qty ?? row.qty ?? 1}
                    </td>
                    <td className="py-2 px-3 text-indigo-600 font-semibold">
                      {row.level3 ? (
                        row.level3
                      ) : (
                        <span className="text-slate-400 font-sans font-normal italic text-[11px]">
                          [Rule 1: Blank → Component = Level 2]
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 font-medium">
                      {row.level3 ? row.level3Qty ?? 1 : '-'}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-500 truncate max-w-xs" title={row.description}>
                      {row.description || '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition"
                          title="Edit Row"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(globalIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
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
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
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
