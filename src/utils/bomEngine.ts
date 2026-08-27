import {
  BOMMode,
  BOMRawRecord,
  BuildScheduleRecord,
  InventoryItem,
  ExplodedRow,
  ComponentDemandSummary,
  ExplosionResult,
  SubassemblyToMake,
} from '../types/bom';

/**
 * Runs the BOM Explosion according to either Power Query 3-Level rules
 * or Multi-Level Hierarchical Recursive Rules.
 */
export function runBOMExplosion(
  bomSource: BOMRawRecord[],
  buildSchedule: BuildScheduleRecord[],
  inventoryMap: Map<string, InventoryItem>,
  mode: BOMMode = 'POWER_QUERY_3_LEVEL',
  options: {
    defaultBuildQty?: number;
    purchasedOnlyInDemand?: boolean;
    partDescriptions?: Map<string, string>;
    onlyScheduledParents?: boolean;
  } = {}
): ExplosionResult {
  const startTime = performance.now();
  const defaultBuild = options.defaultBuildQty ?? 1;
  const circularReferences: string[] = [];

  // Build a quick lookup map for Build Schedule: Parent -> Build Qty
  const buildQtyMap = new Map<string, number>();
  for (const b of buildSchedule) {
    if (b.parent && b.parent.trim()) {
      const parentKey = b.parent.trim();
      const current = buildQtyMap.get(parentKey) ?? 0;
      buildQtyMap.set(parentKey, current + (Number(b.buildQty) || 0));
    }
  }

  let explodedRows: ExplodedRow[] = [];

  if (mode === 'POWER_QUERY_3_LEVEL') {
    explodedRows = explodePowerQuery3Level(
      bomSource,
      buildQtyMap,
      defaultBuild,
      options.partDescriptions,
      options.onlyScheduledParents
    );
  } else {
    const recursiveResult = explodeMultiLevelRecursive(
      bomSource,
      buildQtyMap,
      defaultBuild,
      options.partDescriptions,
      options.onlyScheduledParents
    );
    explodedRows = recursiveResult.rows;
    circularReferences.push(...recursiveResult.cycles);
  }

  // Enrich explodedRows with inventory stock and raise decisions
  for (const row of explodedRows) {
    const inv = inventoryMap.get(row.component.trim());
    const avail = inv?.available !== undefined ? inv.available : (inv?.onHand ?? 0);
    const onHand = inv?.onHand ?? 0;
    row.available = avail;
    row.onHand = onHand;

    if (avail >= row.totalRequired) {
      row.raiseDecision = 'IN_STOCK';
      row.raiseQty = 0;
    } else if (avail > 0) {
      row.raiseDecision = 'PARTIAL_STOCK';
      row.raiseQty = Math.round((row.totalRequired - avail) * 10000) / 10000;
    } else {
      row.raiseDecision = 'RAISE_FULL';
      row.raiseQty = row.totalRequired;
    }

    if (!row.description && inv?.description) {
      row.description = inv.description;
    }
  }

  // Calculate Subassemblies to Make
  const subassembliesToMake = calculateSubassembliesToMake(
    bomSource,
    buildQtyMap,
    inventoryMap,
    options.partDescriptions
  );

  // Aggregate Component Demand
  const componentMap = new Map<string, {
    totalGrossDemand: number;
    description: string;
    isLeaf: boolean;
    partType: string;
    unit: string;
    usedIn: Map<string, { parent: string; buildQty: number; finalQty: number; totalRequired: number }>;
  }>();

  for (const row of explodedRows) {
    const compKey = row.component.trim();
    if (!compKey) continue;

    if (!componentMap.has(compKey)) {
      const inv = inventoryMap.get(compKey);
      const desc = row.description || inv?.description || options.partDescriptions?.get(compKey) || '';
      componentMap.set(compKey, {
        totalGrossDemand: 0,
        description: desc,
        isLeaf: row.isLeaf,
        partType: row.partType || (row.isLeaf ? 'Purchased' : 'Subassembly'),
        unit: row.unit || inv?.unit || 'EA',
        usedIn: new Map(),
      });
    }

    const compData = componentMap.get(compKey)!;
    compData.totalGrossDemand += row.totalRequired;

    // Track usage by parent
    const parentKey = row.parent;
    if (!compData.usedIn.has(parentKey)) {
      compData.usedIn.set(parentKey, {
        parent: parentKey,
        buildQty: row.buildQty,
        finalQty: 0,
        totalRequired: 0,
      });
    }
    const usage = compData.usedIn.get(parentKey)!;
    usage.finalQty += row.finalQty;
    usage.totalRequired += row.totalRequired;
  }

  // Generate Component Summaries with Inventory & Shortages
  const componentSummaries: ComponentDemandSummary[] = [];
  let totalPurchased = 0;
  let totalSubassemblies = 0;
  let shortageCount = 0;
  let totalEstimatedCost = 0;

  for (const [compKey, data] of componentMap.entries()) {
    const inv = inventoryMap.get(compKey);
    const onHand = inv?.onHand ?? 0;
    const safetyStock = inv?.safetyStock ?? 0;
    const unitCost = inv?.unitCost ?? 0;
    const leadTimeDays = inv?.leadTimeDays ?? 7;

    const netShortage = Math.max(0, data.totalGrossDemand + safetyStock - onHand);
    const projectedAvailable = onHand - data.totalGrossDemand;

    let status: 'HEALTHY' | 'LOW_STOCK' | 'SHORTAGE' = 'HEALTHY';
    if (netShortage > 0) {
      status = 'SHORTAGE';
      shortageCount++;
    } else if (projectedAvailable < safetyStock) {
      status = 'LOW_STOCK';
    }

    if (data.isLeaf) {
      totalPurchased++;
    } else {
      totalSubassemblies++;
    }

    const itemCost = data.totalGrossDemand * unitCost;
    totalEstimatedCost += itemCost;

    const usedInList = Array.from(data.usedIn.values());

    componentSummaries.push({
      component: compKey,
      description: data.description,
      totalGrossDemand: Math.round(data.totalGrossDemand * 10000) / 10000,
      onHand,
      safetyStock,
      netShortage: Math.round(netShortage * 10000) / 10000,
      projectedAvailable: Math.round(projectedAvailable * 10000) / 10000,
      status,
      isLeaf: data.isLeaf,
      partType: data.partType,
      unit: data.unit,
      unitCost,
      totalCost: Math.round(itemCost * 100) / 100,
      leadTimeDays,
      parentCount: usedInList.length,
      usedIn: usedInList,
    });
  }

  // Sort component summaries by shortage severity then component name
  componentSummaries.sort((a, b) => {
    if (a.status === 'SHORTAGE' && b.status !== 'SHORTAGE') return -1;
    if (b.status === 'SHORTAGE' && a.status !== 'SHORTAGE') return 1;
    if (a.netShortage !== b.netShortage) return b.netShortage - a.netShortage;
    return a.component.localeCompare(b.component);
  });

  const endTime = performance.now();

  return {
    mode,
    explodedRows,
    componentSummaries,
    subassembliesToMake,
    totalDemandCount: componentSummaries.length,
    totalPurchasedItems: totalPurchased,
    totalSubassemblies: subassembliesToMake.length,
    shortageCount,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    circularReferences,
  };
}

/**
 * Replicates Excel Power Query 3-Level BOM Explosion
 * Business Rules:
 * 1. If Level 3 is blank: Component = Level 2, Final Qty = Level 2 Qty
 * 2. If Level 3 exists: Component = Level 3, Final Qty = Level 2 Qty * Level 3 Qty
 * 3. Join Build_Qty to BOM_Source using BOM_Source Level 1 = Build_Qty Parent
 * 4. If no Build Qty exists: Build Qty = 1
 * 5. Calculate: Total Required = Final Qty * Build Qty
 */
function explodePowerQuery3Level(
  bomSource: BOMRawRecord[],
  buildQtyMap: Map<string, number>,
  defaultBuildQty: number,
  descriptions?: Map<string, string>,
  onlyScheduledParents: boolean = false
): ExplodedRow[] {
  const rows: ExplodedRow[] = [];

  for (let i = 0; i < bomSource.length; i++) {
    const raw = bomSource[i];
    const level1 = (raw.level1 || raw.parent || '').trim();
    const level2 = (raw.level2 || raw.component || '').trim();
    const level2Qty = Number(raw.level2Qty ?? raw.qty ?? 1);
    const level3 = (raw.level3 || '').trim();
    const level3QtyRaw = raw.level3Qty;
    const hasLevel3 = level3 !== '' && level3 !== 'null' && level3 !== 'undefined';
    const level3Qty = hasLevel3 ? Number(level3QtyRaw ?? 1) : 0;

    if (!level1 && !level2) continue;

    const isScheduled = buildQtyMap.has(level1);

    // If onlyScheduledParents is requested and we have scheduled parents, skip unscheduled parents
    if (onlyScheduledParents && buildQtyMap.size > 0 && !isScheduled) {
      continue;
    }

    // Rule 1 & 2
    let targetComponent = '';
    let finalQty = 0;
    let level = 2;
    const path: string[] = [level1];

    if (!hasLevel3) {
      targetComponent = level2;
      finalQty = level2Qty;
      level = 2;
      path.push(level2);
    } else {
      targetComponent = level3;
      finalQty = level2Qty * level3Qty;
      level = 3;
      path.push(level2, level3);
    }

    // Rule 3 & 4: Join Build_Qty by Level 1
    const buildQty = isScheduled
      ? buildQtyMap.get(level1)!
      : defaultBuildQty;

    // Rule 5: Total Required = Final Qty * Build Qty
    const totalRequired = finalQty * buildQty;

    const desc = raw.description || descriptions?.get(targetComponent) || '';

    rows.push({
      id: `pq-row-${i}`,
      parent: level1,
      component: targetComponent,
      description: desc,
      level,
      path,
      pathString: path.join(' → '),
      unitQty: hasLevel3 ? level3Qty : level2Qty,
      finalQty: Math.round(finalQty * 10000) / 10000,
      buildQty,
      totalRequired: Math.round(totalRequired * 10000) / 10000,
      isLeaf: true, // In 3-level explosion, the target is the terminal component
      subassembly: hasLevel3 ? level2 : undefined,
      unit: raw.unit || 'EA',
      isScheduled,
    });
  }

  return rows;
}

/**
 * Calculates all Subassemblies to Make across scheduled parent builds
 */
function calculateSubassembliesToMake(
  bomSource: BOMRawRecord[],
  buildQtyMap: Map<string, number>,
  inventoryMap: Map<string, InventoryItem>,
  descriptions?: Map<string, string>
): SubassemblyToMake[] {
  // Map of subassembly -> demand details
  const subMap = new Map<string, {
    subassembly: string;
    totalUnitsToMake: number;
    parentsMap: Map<string, { parent: string; parentBuildQty: number; subQtyPerParent: number; requiredQty: number }>;
    componentsMap: Map<string, { component: string; qtyPerSub: number }>;
  }>();

  for (const raw of bomSource) {
    const level1 = (raw.level1 || raw.parent || '').trim();
    const level2 = (raw.level2 || raw.component || '').trim();
    const level2Qty = Number(raw.level2Qty ?? raw.qty ?? 1);
    const level3 = (raw.level3 || '').trim();
    const hasLevel3 = level3 !== '' && level3 !== 'null' && level3 !== 'undefined';
    const level3Qty = hasLevel3 ? Number(raw.level3Qty ?? 1) : 0;

    // A subassembly exists if Level 3 exists inside Level 2
    if (hasLevel3 && level2) {
      const parentBuildQty = buildQtyMap.get(level1) ?? 0;
      if (parentBuildQty > 0) {
        if (!subMap.has(level2)) {
          subMap.set(level2, {
            subassembly: level2,
            totalUnitsToMake: 0,
            parentsMap: new Map(),
            componentsMap: new Map(),
          });
        }

        const subEntry = subMap.get(level2)!;
        const requiredForParent = level2Qty * parentBuildQty;

        if (!subEntry.parentsMap.has(level1)) {
          subEntry.parentsMap.set(level1, {
            parent: level1,
            parentBuildQty,
            subQtyPerParent: level2Qty,
            requiredQty: requiredForParent,
          });
          subEntry.totalUnitsToMake += requiredForParent;
        }

        if (!subEntry.componentsMap.has(level3)) {
          subEntry.componentsMap.set(level3, {
            component: level3,
            qtyPerSub: level3Qty,
          });
        }
      }
    }
  }

  // Also check if any parent in the build schedule is defined as a component with children in other BOM lines
  const parentDefinedSubs = new Map<string, Array<{ comp: string; qty: number }>>();
  for (const raw of bomSource) {
    const p = (raw.level1 || raw.parent || '').trim();
    const c = (raw.level2 || raw.component || '').trim();
    const q = Number(raw.level2Qty ?? raw.qty ?? 1);
    if (p && c) {
      if (!parentDefinedSubs.has(p)) {
        parentDefinedSubs.set(p, []);
      }
      parentDefinedSubs.get(p)!.push({ comp: c, qty: q });
    }
  }

  const result: SubassemblyToMake[] = [];

  for (const [subName, entry] of subMap.entries()) {
    const parents = Array.from(entry.parentsMap.values());
    const desc = descriptions?.get(subName) || inventoryMap.get(subName)?.description || `Subassembly ${subName}`;

    // Calculate child components required for this subassembly
    let hasShortage = false;
    const childComponents: SubassemblyToMake['childComponents'] = [];

    // First check direct level3 children
    for (const [compName, compInfo] of entry.componentsMap.entries()) {
      const totalReq = entry.totalUnitsToMake * compInfo.qtyPerSub;
      const inv = inventoryMap.get(compName);
      const onHand = inv?.onHand ?? 0;
      const isShort = onHand < totalReq;
      if (isShort) hasShortage = true;

      childComponents.push({
        component: compName,
        description: descriptions?.get(compName) || inv?.description || '',
        qtyPerSub: compInfo.qtyPerSub,
        totalRequiredForSubs: totalReq,
        onHand,
        stockStatus: isShort ? 'SHORTAGE' : 'AVAILABLE',
      });
    }

    result.push({
      subassembly: subName,
      description: desc,
      totalUnitsToMake: entry.totalUnitsToMake,
      demandedByParents: parents,
      childComponents,
      hasShortage,
    });
  }

  return result.sort((a, b) => b.totalUnitsToMake - a.totalUnitsToMake);
}

/**
 * Multi-Level Recursive Hierarchical BOM Explosion (Arbitrary Depth N-Level)
 */
interface BOMNodeEdge {
  child: string;
  qty: number;
  unit?: string;
  description?: string;
  partType?: string;
}

function explodeMultiLevelRecursive(
  bomSource: BOMRawRecord[],
  buildQtyMap: Map<string, number>,
  defaultBuildQty: number,
  descriptions?: Map<string, string>,
  onlyScheduledParents: boolean = false
): { rows: ExplodedRow[]; cycles: string[] } {
  const rows: ExplodedRow[] = [];
  const cycles: string[] = [];

  const adj = new Map<string, BOMNodeEdge[]>();
  const allParents = new Set<string>();
  const allChildren = new Set<string>();

  for (const item of bomSource) {
    const p = (item.parent || item.level1 || '').trim();
    const c = (item.component || item.level2 || '').trim();
    const q = Number(item.qty ?? item.level2Qty ?? 1);

    if (!p || !c) continue;

    allParents.add(p);
    allChildren.add(c);

    if (!adj.has(p)) adj.set(p, []);
    adj.get(p)!.push({
      child: c,
      qty: q,
      unit: item.unit || 'EA',
      description: item.description || descriptions?.get(c) || '',
      partType: item.partType,
    });
  }

  // Find root parents
  let rootParents: string[] = [];
  if (buildQtyMap.size > 0) {
    rootParents = Array.from(buildQtyMap.keys());
    if (!onlyScheduledParents) {
      // Include other root parents if not strict
      for (const p of allParents) {
        if (!buildQtyMap.has(p) && !allChildren.has(p)) {
          rootParents.push(p);
        }
      }
    }
  } else {
    rootParents = Array.from(allParents).filter((p) => !allChildren.has(p));
    if (rootParents.length === 0) rootParents = Array.from(allParents);
  }

  let rowCounter = 0;

  function traverse(
    topParent: string,
    currentParent: string,
    currentPath: string[],
    accumulatedMultiplier: number,
    level: number,
    visitedInPath: Set<string>
  ) {
    const edges = adj.get(currentParent);

    if (!edges || edges.length === 0) {
      return;
    }

    const isScheduled = buildQtyMap.has(topParent);

    for (const edge of edges) {
      if (visitedInPath.has(edge.child)) {
        cycles.push(`${currentPath.join(' → ')} → ${edge.child} (Cycle detected)`);
        continue;
      }

      const nextMultiplier = accumulatedMultiplier * edge.qty;
      const nextPath = [...currentPath, edge.child];
      const childEdges = adj.get(edge.child);
      const isLeaf = !childEdges || childEdges.length === 0;

      const buildQty = isScheduled
        ? buildQtyMap.get(topParent)!
        : defaultBuildQty;

      const totalRequired = nextMultiplier * buildQty;

      rows.push({
        id: `ml-row-${rowCounter++}`,
        parent: topParent,
        component: edge.child,
        description: edge.description,
        level,
        path: nextPath,
        pathString: nextPath.join(' → '),
        unitQty: edge.qty,
        finalQty: Math.round(nextMultiplier * 10000) / 10000,
        buildQty,
        totalRequired: Math.round(totalRequired * 10000) / 10000,
        isLeaf,
        subassembly: currentParent !== topParent ? currentParent : undefined,
        partType: edge.partType || (isLeaf ? 'Purchased' : 'Subassembly'),
        unit: edge.unit,
        isScheduled,
      });

      if (!isLeaf) {
        const nextVisited = new Set(visitedInPath);
        nextVisited.add(edge.child);
        traverse(topParent, edge.child, nextPath, nextMultiplier, level + 1, nextVisited);
      }
    }
  }

  for (const root of rootParents) {
    const visited = new Set<string>([root]);
    traverse(root, root, [root], 1, 2, visited);
  }

  return { rows, cycles };
}
