export type BOMMode = 'POWER_QUERY_3_LEVEL' | 'MULTI_LEVEL_RECURSIVE';

export interface BOMRawRecord {
  id?: string;
  // 3-Level PowerQuery style columns
  level1?: string;
  level2?: string;
  level2Qty?: number;
  level3?: string;
  level3Qty?: number;

  // Hierarchical Parent-Child style columns
  parent?: string;
  component?: string;
  qty?: number;
  unit?: string;
  description?: string;
  partType?: 'Purchased' | 'Subassembly' | 'Raw Material' | string;
  leadTimeDays?: number;
  unitCost?: number;
  [key: string]: any;
}

export interface BuildScheduleRecord {
  id?: string;
  parent: string;
  buildQty: number;
  workOrder?: string;
  dueDate?: string;
  notes?: string;
}

export interface InventoryItem {
  partNumber: string;
  description?: string;
  onHand: number;
  available?: number;
  committed?: number;
  location?: string;
  binNumber?: string;
  safetyStock?: number;
  allocated?: number;
  unitCost?: number;
  leadTimeDays?: number;
  unit?: string;
}

export interface ExplodedRow {
  id: string;
  parent: string; // Top-level parent
  component: string; // Target component or resolved leaf
  description?: string;
  level: number; // 1, 2, 3...
  path: string[]; // Hierarchy path e.g. ["710-RSL-00003", "MS30M", "RLTAB-12"]
  pathString: string;
  unitQty: number; // Qty in direct parent
  finalQty: number; // Multiplier per 1 top-level parent
  buildQty: number; // Build qty for top-level parent
  totalRequired: number; // finalQty * buildQty
  available?: number; // Total available on hand stock
  onHand?: number; // Total on hand quantity
  raiseDecision?: 'IN_STOCK' | 'PARTIAL_STOCK' | 'RAISE_FULL'; // Whether we need to raise parts
  raiseQty?: number; // Quantity needed to raise (totalRequired - available)
  isLeaf: boolean; // Purchased component (no further subcomponents)
  subassembly?: string; // Direct immediate parent/subassembly
  partType?: string;
  unit?: string;
  isScheduled?: boolean; // True if parent is in the pasted build schedule
}

export interface SubassemblyToMake {
  subassembly: string;
  description?: string;
  totalUnitsToMake: number;
  demandedByParents: {
    parent: string;
    parentBuildQty: number;
    subQtyPerParent: number;
    requiredQty: number;
  }[];
  childComponents: {
    component: string;
    description?: string;
    qtyPerSub: number;
    totalRequiredForSubs: number;
    onHand: number;
    stockStatus: 'AVAILABLE' | 'SHORTAGE';
  }[];
  hasShortage: boolean;
}

export interface ComponentDemandSummary {
  component: string;
  description: string;
  totalGrossDemand: number;
  onHand: number;
  safetyStock: number;
  netShortage: number; // Math.max(0, totalGrossDemand + safetyStock - onHand)
  projectedAvailable: number; // onHand - totalGrossDemand
  status: 'HEALTHY' | 'LOW_STOCK' | 'SHORTAGE';
  isLeaf: boolean;
  partType: string;
  unit: string;
  unitCost: number;
  totalCost: number;
  leadTimeDays: number;
  parentCount: number;
  usedIn: {
    parent: string;
    buildQty: number;
    finalQty: number;
    totalRequired: number;
  }[];
}

export interface ExplosionResult {
  mode: BOMMode;
  explodedRows: ExplodedRow[];
  componentSummaries: ComponentDemandSummary[];
  subassembliesToMake: SubassemblyToMake[];
  totalDemandCount: number;
  totalPurchasedItems: number;
  totalSubassemblies: number;
  shortageCount: number;
  totalEstimatedCost: number;
  executionTimeMs: number;
  circularReferences: string[];
}

export interface FileParseResult<T> {
  data: T[];
  fileName: string;
  headers: string[];
  totalRows: number;
  errors?: string[];
}
