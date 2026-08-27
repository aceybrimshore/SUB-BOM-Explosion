import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Package,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { BOMRawRecord, BuildScheduleRecord, ComponentDemandSummary } from '../types/bom';

interface HierarchicalTreeViewProps {
  bomSource: BOMRawRecord[];
  buildSchedule: BuildScheduleRecord[];
  componentSummaries: ComponentDemandSummary[];
  defaultBuildQty: number;
}

interface TreeNode {
  name: string;
  qtyPerParent: number;
  cumulativeQty: number;
  totalRequired: number;
  level: number;
  isLeaf: boolean;
  description?: string;
  unit?: string;
  shortage?: number;
  status?: 'HEALTHY' | 'LOW_STOCK' | 'SHORTAGE';
  children: TreeNode[];
}

export const HierarchicalTreeView: React.FC<HierarchicalTreeViewProps> = ({
  bomSource,
  buildSchedule,
  componentSummaries,
  defaultBuildQty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedParent, setSelectedParent] = useState<string>('ALL');

  // Map for quick summary lookup
  const summaryMap = useMemo(() => {
    const map = new Map<string, ComponentDemandSummary>();
    componentSummaries.forEach((s) => map.set(s.component, s));
    return map;
  }, [componentSummaries]);

  // Build tree data structures
  const buildQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    buildSchedule.forEach((b) => {
      if (b.parent) {
        map.set(b.parent.trim(), (map.get(b.parent.trim()) || 0) + (Number(b.buildQty) || 0));
      }
    });
    return map;
  }, [buildSchedule]);

  // Build trees
  const trees = useMemo(() => {
    const adj = new Map<string, { child: string; qty: number; desc?: string; unit?: string }[]>();
    const allChildren = new Set<string>();
    const allParents = new Set<string>();

    for (const row of bomSource) {
      const l1 = (row.level1 || row.parent || '').trim();
      const l2 = (row.level2 || row.component || '').trim();
      const l2Qty = Number(row.level2Qty ?? row.qty ?? 1);
      const l3 = (row.level3 || '').trim();
      const l3Qty = Number(row.level3Qty ?? 1);

      if (l1 && l2) {
        allParents.add(l1);
        allChildren.add(l2);

        if (!adj.has(l1)) adj.set(l1, []);

        if (l3) {
          // L1 -> L2
          if (!adj.has(l2)) adj.set(l2, []);
          adj.get(l2)!.push({ child: l3, qty: l3Qty, desc: row.description, unit: row.unit });
          allParents.add(l2);
          allChildren.add(l3);
        } else {
          adj.get(l1)!.push({ child: l2, qty: l2Qty, desc: row.description, unit: row.unit });
        }
      }
    }

    // Top Level Parents
    let roots: string[] = [];
    for (const p of buildQtyMap.keys()) {
      if (p) roots.push(p);
    }
    for (const p of allParents) {
      if (!allChildren.has(p) && !roots.includes(p)) {
        roots.push(p);
      }
    }
    if (roots.length === 0) roots = Array.from(allParents);

    function buildSubtree(
      name: string,
      qtyPerParent: number,
      cumulativeQty: number,
      buildQty: number,
      level: number,
      visited: Set<string>
    ): TreeNode {
      const isSub = adj.has(name) && adj.get(name)!.length > 0;
      const isLeaf = !isSub;
      const totalReq = cumulativeQty * buildQty;
      const summary = summaryMap.get(name);

      const childrenNodes: TreeNode[] = [];
      if (isSub && !visited.has(name)) {
        const nextVisited = new Set(visited);
        nextVisited.add(name);

        for (const edge of adj.get(name)!) {
          const stepCum = cumulativeQty * edge.qty;
          childrenNodes.push(
            buildSubtree(edge.child, edge.qty, stepCum, buildQty, level + 1, nextVisited)
          );
        }
      }

      return {
        name,
        qtyPerParent,
        cumulativeQty,
        totalRequired: totalReq,
        level,
        isLeaf,
        description: summary?.description,
        unit: summary?.unit || 'EA',
        shortage: summary?.netShortage,
        status: summary?.status,
        children: childrenNodes,
      };
    }

    const built: TreeNode[] = [];
    for (const root of roots) {
      const bQty = buildQtyMap.has(root) ? buildQtyMap.get(root)! : defaultBuildQty;
      built.push(buildSubtree(root, 1, 1, bQty, 1, new Set()));
    }

    return built;
  }, [bomSource, buildQtyMap, defaultBuildQty, summaryMap]);

  // Expand all initial roots
  React.useEffect(() => {
    const initial = new Set<string>();
    trees.forEach((t) => {
      initial.add(t.name);
      t.children.forEach((c) => initial.add(`${t.name}/${c.name}`));
    });
    setExpandedNodes(initial);
  }, [trees]);

  const toggleExpand = (pathKey: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    function collect(node: TreeNode, currentPath: string) {
      const path = currentPath ? `${currentPath}/${node.name}` : node.name;
      all.add(path);
      node.children.forEach((c) => collect(c, path));
    }
    trees.forEach((t) => collect(t, ''));
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const visibleTrees = useMemo(() => {
    if (selectedParent === 'ALL') return trees;
    return trees.filter((t) => t.name === selectedParent);
  }, [trees, selectedParent]);

  // Recursive Tree Node Renderer
  const renderNode = (node: TreeNode, currentPath: string) => {
    const nodeKey = currentPath ? `${currentPath}/${node.name}` : node.name;
    const isExpanded = expandedNodes.has(nodeKey);
    const hasChildren = node.children.length > 0;
    const matchesSearch =
      !searchTerm ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div key={nodeKey} className="text-xs">
        <div
          onClick={() => hasChildren && toggleExpand(nodeKey)}
          className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition group ${
            hasChildren ? 'cursor-pointer hover:bg-slate-100/80' : 'hover:bg-slate-100/50'
          } ${matchesSearch && searchTerm ? 'bg-indigo-50 ring-1 ring-indigo-500' : ''}`}
          style={{ paddingLeft: `${node.level * 18}px` }}
        >
          {/* Left: Expander & Name */}
          <div className="flex items-center space-x-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                className="text-slate-400 group-hover:text-slate-700 transition p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5 inline-block" />
            )}

            {node.isLeaf ? (
              <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}

            <div className="flex items-center space-x-2 truncate">
              <span className={`font-mono font-semibold ${node.level === 1 ? 'text-indigo-600 text-sm font-bold' : 'text-slate-800'}`}>
                {node.name}
              </span>
              {node.description && (
                <span className="text-slate-500 text-[11px] truncate max-w-xs font-sans">
                  — {node.description}
                </span>
              )}
            </div>
          </div>

          {/* Right: Multipliers & Requirements */}
          <div className="flex items-center space-x-2.5 shrink-0 font-mono text-[11px]">
            {node.level > 1 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                {node.qtyPerParent}x per parent
              </span>
            )}

            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              Cum: <strong className="text-slate-900">{node.cumulativeQty}x</strong>
            </span>

            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold border border-indigo-200">
              Demand: {node.totalRequired.toLocaleString()} {node.unit}
            </span>

            {node.shortage && node.shortage > 0 ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Short: {node.shortage}</span>
              </span>
            ) : node.isLeaf ? (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Stocked</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 ml-4 pl-1 my-0.5 space-y-0.5">
            {node.children.map((child) => renderNode(child, nodeKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="hierarchical-tree-container" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Multi-Level Hierarchical BOM Tree & Dependency Graph</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive indented explosion tree showing subassembly multipliers and shortage flags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Node */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Highlight part in tree..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
            />
          </div>

          {/* Select Parent */}
          <select
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Root Assemblies</option>
            {trees.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Expand/Collapse All */}
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition hover:text-indigo-600"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition hover:text-indigo-600"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Collapse</span>
          </button>
        </div>
      </div>

      {/* Tree Body */}
      <div className="p-4 overflow-x-auto min-h-[350px] max-h-[600px] overflow-y-auto space-y-1 bg-slate-50/40">
        {visibleTrees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No assemblies found to explode.
          </div>
        ) : (
          visibleTrees.map((tree) => renderNode(tree, ''))
        )}
      </div>
    </div>
  );
};
