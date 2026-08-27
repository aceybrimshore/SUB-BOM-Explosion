import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ExplodedRow, ComponentDemandSummary, BuildScheduleRecord, BOMRawRecord } from '../types/bom';

/**
 * Exports complete BOM explosion & MRP results into a multi-tab Excel Workbook (.xlsx)
 */
export function exportToExcel(data: {
  explodedRows: ExplodedRow[];
  componentSummaries: ComponentDemandSummary[];
  buildSchedule: BuildScheduleRecord[];
  bomSource: BOMRawRecord[];
  fileName?: string;
}) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Component Demand & MRP (Aggregated)
  const demandSheetData = data.componentSummaries.map((c) => ({
    'Component Part Number': c.component,
    'Description': c.description || '',
    'Type': c.partType,
    'Total Gross Demand': c.totalGrossDemand,
    'On Hand Stock': c.onHand,
    'Safety Stock': c.safetyStock,
    'Net Shortage': c.netShortage,
    'Projected Balance': c.projectedAvailable,
    'Status': c.status === 'SHORTAGE' ? 'CRITICAL SHORTAGE' : c.status === 'LOW_STOCK' ? 'LOW BUFFER' : 'OK',
    'Unit': c.unit,
    'Unit Cost ($)': c.unitCost,
    'Total Cost Demand ($)': c.totalCost,
    'Lead Time (Days)': c.leadTimeDays,
    'Used In # Parents': c.parentCount,
  }));
  const wsDemand = XLSX.utils.json_to_sheet(demandSheetData);
  XLSX.utils.book_append_sheet(wb, wsDemand, 'MRP_Component_Demand');

  // Tab 2: Exploded Parent Breakdown (Power Query style + recursive breakdown)
  const breakdownSheetData = data.explodedRows.map((r) => ({
    'Parent Assembly (Level 1)': r.parent,
    'Exploded Component': r.component,
    'Description': r.description || '',
    'Level': r.level,
    'Hierarchy Path': r.pathString,
    'Qty in Parent': r.unitQty,
    'Final Qty Multiplier': r.finalQty,
    'Build Qty': r.buildQty,
    'Total Required': r.totalRequired,
    'Part Type': r.partType || (r.isLeaf ? 'Purchased' : 'Subassembly'),
    'Immediate Subassembly': r.subassembly || '',
  }));
  const wsBreakdown = XLSX.utils.json_to_sheet(breakdownSheetData);
  XLSX.utils.book_append_sheet(wb, wsBreakdown, 'Parent_Explosion_Breakdown');

  // Tab 3: Shortage Action List
  const shortages = data.componentSummaries.filter((c) => c.status === 'SHORTAGE');
  const shortageSheetData = shortages.map((s) => ({
    'Shortage Component': s.component,
    'Description': s.description,
    'Gross Demand': s.totalGrossDemand,
    'On Hand': s.onHand,
    'Safety Buffer': s.safetyStock,
    'Net Order Quantity Needed': s.netShortage,
    'Unit Cost ($)': s.unitCost,
    'Shortage Financial Impact ($)': Math.round(s.netShortage * s.unitCost * 100) / 100,
    'Lead Time (Days)': s.leadTimeDays,
    'Affected Parents': s.usedIn.map((u) => `${u.parent} (Needs ${u.totalRequired})`).join('; '),
  }));
  const wsShortages = XLSX.utils.json_to_sheet(shortageSheetData);
  XLSX.utils.book_append_sheet(wb, wsShortages, 'Critical_Shortages_Action');

  // Tab 4: Active Build Schedule
  const scheduleSheetData = data.buildSchedule.map((b) => ({
    'Parent Assembly': b.parent,
    'Build Quantity': b.buildQty,
    'Work Order': b.workOrder || '',
    'Due Date': b.dueDate || '',
    'Notes': b.notes || '',
  }));
  const wsSchedule = XLSX.utils.json_to_sheet(scheduleSheetData);
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Active_Build_Schedule');

  // Tab 5: Raw BOM Source
  const bomSourceData = data.bomSource.map((b) => ({
    'Level 1 (Parent)': b.level1 || b.parent || '',
    'Level 2 (Component)': b.level2 || b.component || '',
    'Level 2 Qty': b.level2Qty ?? b.qty ?? 1,
    'Level 3 (Sub-Component)': b.level3 || '',
    'Level 3 Qty': b.level3Qty || '',
    'Description': b.description || '',
    'Unit': b.unit || 'EA',
  }));
  const wsBOM = XLSX.utils.json_to_sheet(bomSourceData);
  XLSX.utils.book_append_sheet(wb, wsBOM, 'BOM_Source_Input');

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const outFileName = data.fileName || `BOM_MRP_Explosion_Results_${dateStr}.xlsx`;
  XLSX.writeFile(wb, outFileName);
}

/**
 * Exports single table data to CSV format
 */
export function exportTableToCSV(data: any[], fileName: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads starter templates for BOM Source, Build Schedule, and Inventory
 */
export function downloadStarterTemplate(type: 'BOM_3_LEVEL' | 'BOM_MULTI_LEVEL' | 'BUILD_SCHEDULE' | 'INVENTORY') {
  const wb = XLSX.utils.book_new();

  if (type === 'BOM_3_LEVEL') {
    const templateData = [
      { 'Level 1': '710-RSL-00003', 'Level 2': 'MS30M', 'Level 2 Qty': 2, 'Level 3': 'RLTAB-12', 'Level 3 Qty': 4, 'Description': 'Release Tab Clip' },
      { 'Level 1': '710-RSL-00003', 'Level 2': 'MS30M', 'Level 2 Qty': 2, 'Level 3': 'SPRING-091', 'Level 3 Qty': 2, 'Description': 'Return Spring' },
      { 'Level 1': '710-RSL-00003', 'Level 2': 'P46-100', 'Level 2 Qty': 1, 'Level 3': 'SUB0581', 'Level 3 Qty': 3, 'Description': 'Seal Bushing' },
      { 'Level 1': '710-RSL-00003', 'Level 2': 'AL-CHASSIS-01', 'Level 2 Qty': 1, 'Level 3': '', 'Level 3 Qty': '', 'Description': 'Aluminum Chassis' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'BOM_Source');
    XLSX.writeFile(wb, 'BOM_3_Level_PowerQuery_Template.xlsx');
  } else if (type === 'BOM_MULTI_LEVEL') {
    const templateData = [
      { 'Parent': 'ASSY-TOP-01', 'Component': 'SUB-MOTOR-01', 'Qty': 2, 'Unit': 'EA', 'Description': 'Motor Subassembly', 'PartType': 'Subassembly' },
      { 'Parent': 'SUB-MOTOR-01', 'Component': 'ROTOR-COPPER', 'Qty': 1, 'Unit': 'EA', 'Description': 'Copper Rotor Core', 'PartType': 'Purchased' },
      { 'Parent': 'SUB-MOTOR-01', 'Component': 'BEARING-608ZZ', 'Qty': 2, 'Unit': 'EA', 'Description': 'Ball Bearing 8x22x7', 'PartType': 'Purchased' },
      { 'Parent': 'ASSY-TOP-01', 'Component': 'FRAME-CHASSIS', 'Qty': 1, 'Unit': 'EA', 'Description': 'Main Frame', 'PartType': 'Purchased' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Hierarchical_BOM');
    XLSX.writeFile(wb, 'BOM_Hierarchical_Template.xlsx');
  } else if (type === 'BUILD_SCHEDULE') {
    const templateData = [
      { 'Parent': '710-RSL-00003', 'Build Qty': 25, 'Work Order': 'WO-001', 'Due Date': '2026-09-15', 'Notes': 'Primary Production Run' },
      { 'Parent': '720-PWR-00004', 'Build Qty': 50, 'Work Order': 'WO-002', 'Due Date': '2026-09-20', 'Notes': 'Power Supply Batch' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Build_Schedule');
    XLSX.writeFile(wb, 'Build_Schedule_Template.xlsx');
  } else if (type === 'INVENTORY') {
    const templateData = [
      { 'Part Number': 'RLTAB-12', 'Description': 'Release Tab Fastener Clip', 'On Hand': 150, 'Safety Stock': 50, 'Unit Cost': 1.45, 'Lead Time Days': 5 },
      { 'Part Number': 'SPRING-091', 'Description': 'Tension Return Spring 9mm', 'On Hand': 80, 'Safety Stock': 20, 'Unit Cost': 0.85, 'Lead Time Days': 14 },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Stock');
    XLSX.writeFile(wb, 'Inventory_Stock_Template.xlsx');
  }
}
