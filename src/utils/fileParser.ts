import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { BOMRawRecord, BuildScheduleRecord, InventoryItem, FileParseResult, ColumnMappingConfig } from '../types/bom';

/**
 * Normalizes text headers for fuzzy matching
 */
function cleanKey(key: string): string {
  return (key || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parse a raw CSV string into an array of JS objects
 */
export function parseCSVStringToObjects(csvText: string): any[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });
  return (result.data as any[]) || [];
}

/**
 * Parse an uploaded file (Excel or CSV) into raw array of objects
 */
export async function parseUploadedFile(file: File): Promise<{ rows: any[]; headers: string[]; fileName: string }> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: true,
        complete: (results) => {
          const headers = (results.meta.fields || []).filter(Boolean);
          resolve({ rows: results.data as any[], headers, fileName });
        },
        error: (error) => reject(error),
      });
    });
  }

  // Excel format (.xlsx, .xls, .xlsm, .csv)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
        
        // Extract headers from sheet range
        const headers: string[] = [];
        if (json.length > 0) {
          Object.keys(json[0]).forEach((k) => headers.push(k));
        }

        resolve({ rows: json, headers, fileName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Maps raw rows into BOMRawRecord array
 */
export function mapToBOMSource(rawRows: any[], fileName: string): FileParseResult<BOMRawRecord> {
  const result: BOMRawRecord[] = [];
  const errors: string[] = [];

  if (!rawRows || rawRows.length === 0) {
    return { data: [], fileName, headers: [], totalRows: 0, errors: ['File is empty'] };
  }

  const rawHeaders = Object.keys(rawRows[0]);

  // Find column matches
  const findCol = (candidates: string[]): string | undefined => {
    const cleanCandidates = candidates.map(cleanKey);
    return rawHeaders.find((h) => cleanCandidates.includes(cleanKey(h)));
  };

  const colL1 = findCol(['level1', 'level1parent', 'parentassembly', 'parent', 'toplevel', 'parentpart', 'topassembly']);
  const colL2 = findCol(['level2', 'level2component', 'component', 'child', 'subassembly', 'partnumber', 'part', 'item']);
  const colL2Qty = findCol(['level2qty', 'level2quantity', 'qty', 'quantity', 'qtyper', 'qtyperparent', 'usage']);
  const colL3 = findCol(['level3', 'level3component', 'subcomponent', 'childcomponent', 'level3part']);
  const colL3Qty = findCol(['level3qty', 'level3quantity', 'subqty']);
  const colDesc = findCol(['description', 'partdescription', 'itemdescription', 'name', 'desc']);
  const colUnit = findCol(['unit', 'uom', 'unitofmeasure']);
  const colType = findCol(['parttype', 'type', 'category', 'itemtype']);
  const colCost = findCol(['unitcost', 'cost', 'price', 'standardcost']);

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    const l1Val = colL1 ? String(row[colL1] ?? '').trim() : '';
    const l2Val = colL2 ? String(row[colL2] ?? '').trim() : '';
    const l3Val = colL3 ? String(row[colL3] ?? '').trim() : '';

    const l2QtyVal = colL2Qty && row[colL2Qty] !== '' && row[colL2Qty] !== undefined ? Number(row[colL2Qty]) : 1;
    const l3QtyVal = colL3Qty && row[colL3Qty] !== '' && row[colL3Qty] !== undefined ? Number(row[colL3Qty]) : 0;

    if (!l1Val && !l2Val) continue; // skip blank row

    result.push({
      id: `bom-imp-${i + 1}`,
      level1: l1Val || l2Val,
      level2: l2Val,
      level2Qty: isNaN(l2QtyVal) ? 1 : l2QtyVal,
      level3: l3Val,
      level3Qty: isNaN(l3QtyVal) ? 0 : l3QtyVal,
      parent: l1Val,
      component: l2Val,
      qty: isNaN(l2QtyVal) ? 1 : l2QtyVal,
      description: colDesc ? String(row[colDesc] ?? '') : '',
      unit: colUnit ? String(row[colUnit] ?? 'EA') : 'EA',
      partType: colType ? String(row[colType] ?? '') : undefined,
      unitCost: colCost && !isNaN(Number(row[colCost])) ? Number(row[colCost]) : undefined,
    });
  }

  return {
    data: result,
    fileName,
    headers: rawHeaders,
    totalRows: result.length,
    errors,
  };
}

/**
 * Maps raw rows into BuildScheduleRecord array
 */
export function mapToBuildSchedule(
  rawRows: any[],
  fileName: string,
  columnMapping?: ColumnMappingConfig
): FileParseResult<BuildScheduleRecord> {
  const result: BuildScheduleRecord[] = [];
  const errors: string[] = [];

  if (!rawRows || rawRows.length === 0) {
    return { data: [], fileName, headers: [], totalRows: 0, errors: ['File is empty'] };
  }

  const rawHeaders = Object.keys(rawRows[0]);

  const findCol = (candidates: string[]): string | undefined => {
    const cleanCandidates = candidates.map(cleanKey);
    return rawHeaders.find((h) => cleanCandidates.includes(cleanKey(h)));
  };

  // 1. Parent / SKU / Assembly column detection
  const parentCandidates = [
    'sku',
    'item',
    'itemnumber',
    'itemno',
    'parent',
    'parentassembly',
    'parentpart',
    'assembly',
    'product',
    'productname',
    'productcode',
    'part',
    'partnumber',
    'partno',
    'code',
    'level1',
    'toplevel',
    'model',
  ];

  let colParent: string | undefined = columnMapping?.parentCol;
  if (!colParent) {
    // Check if any candidate matches headers
    colParent = findCol(parentCandidates);

    // If Column B exists (index 1) and Column A is metadata (Urgency, Status, Priority, Location, Index, Line, etc.)
    if (!colParent && rawHeaders.length >= 2) {
      const colAKey = cleanKey(rawHeaders[0]);
      if (['urgency', 'status', 'priority', 'location', 'index', 'id', 'line', 'seq'].includes(colAKey)) {
        colParent = rawHeaders[1];
      }
    }

    // Default positional fallbacks
    if (!colParent) {
      if (rawHeaders.length >= 2 && cleanKey(rawHeaders[0]).includes('location')) {
        colParent = rawHeaders[1];
      } else if (rawHeaders.length >= 2) {
        colParent = rawHeaders[1]; // Column B as default for ERP reports
      } else if (rawHeaders.length >= 1) {
        colParent = rawHeaders[0];
      }
    }
  }

  // 2. Build Qty / Demand / Back Order column detection
  const qtyCandidates = [
    // Back Order variations (from NetSuite / ERP back order reports)
    'backorder',
    'backorde',
    'backorders',
    'backordered',
    'backorderqty',
    'backorderquantity',
    'backord',
    'boqty',
    'bo',
    'b/o',
    'b/oqty',
    'orderqty',
    'orderquantity',
    'orderedqty',
    'openqty',
    'openquantity',
    'sumofunitstoproduce',
    'unitstoproduce',
    'unitsproduce',
    'buildqty',
    'buildquantity',
    'qty',
    'quantity',
    'ordersize',
    'plannedqty',
    'demand',
    'demandqty',
    'tobuild',
    'unitstobuild',
    'quantitytobuild',
    'requiredqty',
    'requireqty',
    'needqty',
    'soqty',
    'salesorderqty',
    'netqty',
    'build',
    'units',
  ];

  let colBuildQty: string | undefined = columnMapping?.qtyCol;
  if (!colBuildQty) {
    colBuildQty = findCol(qtyCandidates);

    // If Column F exists (index 5) in a 6+ column spreadsheet:
    // Check if Column F is numeric or has back order context
    if (!colBuildQty && rawHeaders.length >= 6) {
      const colF = rawHeaders[5];
      const hasNumeric = rawRows.some((r) => {
        const val = r[colF];
        return val !== '' && val !== null && val !== undefined && !isNaN(Number(val));
      });
      if (hasNumeric) {
        colBuildQty = colF;
      }
    }

    // 4-column summary fallback
    if (!colBuildQty && rawHeaders.length >= 4 && cleanKey(rawHeaders[0]).includes('location')) {
      colBuildQty = rawHeaders[3];
    }
  }

  // 3. Work Order / Sales Order / Document Number detection
  const woCandidates = [
    'documentnumber',
    'documentno',
    'docnumber',
    'docno',
    'document',
    'salesorder',
    'salesorderno',
    'sono',
    'so',
    'workorder',
    'wo',
    'workorderno',
    'sumofinternalid',
    'internalid',
    'internal_id',
    'id',
    'order',
    'ordernumber',
    'orderno',
    'batch',
    'batchid',
    'job',
    'jobnumber',
  ];
  const colWorkOrder = columnMapping?.workOrderCol || findCol(woCandidates) || (rawHeaders.length >= 3 && cleanKey(rawHeaders[0]).includes('location') ? rawHeaders[2] : undefined);
  const colDocNumber = findCol(['documentnumber', 'documentno', 'docnumber', 'docno', 'salesorder', 'sono']);

  // 4. Due Date / Required Date detection
  const dueDateCandidates = [
    'requireddate',
    'requiredd',
    'needdate',
    'duedate',
    'due_date',
    'date',
    'targetdate',
    'completiondate',
    'schedule',
    'deliverydate',
  ];
  const colDueDate = columnMapping?.dueDateCol || findCol(dueDateCandidates);

  // 5. Context / Notes columns
  const colUrgency = findCol(['urgency', 'priority']);
  const colCustomer = findCol(['customer', 'customername', 'client', 'account']);
  const colItemType = findCol(['itemtype', 'type', 'parttype']);
  const colLocation = findCol(['location', 'site', 'warehouse']);
  const colBrand = findCol(['brand', 'manufacturer']);
  const colGeneralNotes = findCol(['notes', 'comment', 'description', 'remarks']);

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const parentVal = colParent ? String(row[colParent] ?? '').trim() : '';
    const buildQtyVal = colBuildQty && row[colBuildQty] !== '' && row[colBuildQty] !== undefined ? Number(row[colBuildQty]) : 1;

    if (!parentVal) continue;

    // Prefer specific Document Number if Work Order is "No Work Order" or empty
    let woVal = colWorkOrder ? String(row[colWorkOrder] ?? '').trim() : '';
    const docVal = colDocNumber ? String(row[colDocNumber] ?? '').trim() : '';
    if (!woVal || woVal.toLowerCase().includes('no work') || woVal.toLowerCase() === 'no work order') {
      if (docVal) woVal = docVal;
    }

    // Build context notes
    const notePieces: string[] = [];
    if (colUrgency && row[colUrgency]) notePieces.push(`Urgency: ${row[colUrgency]}`);
    if (docVal && woVal !== docVal) notePieces.push(`SO: ${docVal}`);
    if (colCustomer && row[colCustomer]) notePieces.push(`Customer: ${row[colCustomer]}`);
    if (colItemType && row[colItemType]) notePieces.push(`Type: ${row[colItemType]}`);
    if (colLocation && row[colLocation]) notePieces.push(`Loc: ${row[colLocation]}`);
    if (colBrand && row[colBrand]) notePieces.push(`Brand: ${row[colBrand]}`);
    if (colGeneralNotes && row[colGeneralNotes]) notePieces.push(String(row[colGeneralNotes]));

    result.push({
      id: `build-imp-${i + 1}`,
      parent: parentVal,
      buildQty: isNaN(buildQtyVal) ? 1 : buildQtyVal,
      workOrder: woVal || undefined,
      dueDate: colDueDate && row[colDueDate] ? String(row[colDueDate]).trim() : undefined,
      notes: notePieces.length > 0 ? notePieces.join(' | ') : undefined,
    });
  }

  // Summary of detected mapping for UI display
  const colSummary = colParent && colBuildQty
    ? `Item: "${colParent}" · Qty: "${colBuildQty}"`
    : 'Default column mapping applied';

  return {
    data: result,
    fileName,
    headers: rawHeaders,
    totalRows: result.length,
    errors,
    detectedColumns: {
      parentCol: colParent,
      qtyCol: colBuildQty,
      workOrderCol: colWorkOrder,
      dueDateCol: colDueDate,
      summary: colSummary,
    },
    rawRows,
  };
}

/**
 * Maps raw rows into InventoryItem array and aggregates quantities by part number
 */
export function mapToInventory(rawRows: any[], fileName: string): FileParseResult<InventoryItem> {
  const errors: string[] = [];

  if (!rawRows || rawRows.length === 0) {
    return { data: [], fileName, headers: [], totalRows: 0, errors: ['File is empty'] };
  }

  const rawHeaders = Object.keys(rawRows[0]);

  const findCol = (candidates: string[]): string | undefined => {
    const cleanCandidates = candidates.map(cleanKey);
    return rawHeaders.find((h) => cleanCandidates.includes(cleanKey(h)));
  };

  const colPart = findCol(['item', 'partnumber', 'part', 'component', 'sku', 'partno', 'code']);
  const colDesc = findCol(['displayname', 'display_name', 'description', 'partdescription', 'name', 'desc']);
  const colOnHand = findCol(['onhand', 'on_hand', 'onhandqty', 'stock', 'inventory', 'quantityonhand', 'qty', 'currentstock']);
  const colAvailable = findCol(['available', 'availablestock', 'availableqty', 'avail', 'free']);
  const colCommitted = findCol(['committed', 'allocated', 'reserve', 'reserved']);
  const colLocation = findCol(['location', 'warehouse', 'site']);
  const colBin = findCol(['binnumber', 'bin_number', 'bin', 'rack']);
  const colSafety = findCol(['safetystock', 'safety', 'minstock', 'buffer']);
  const colCost = findCol(['unitcost', 'cost', 'standardcost', 'price']);
  const colLead = findCol(['leadtimedays', 'leadtime', 'lead_time', 'days']);
  const colUnit = findCol(['unit', 'uom']);

  // Aggregate items across multiple bins/locations
  const itemMap = new Map<string, InventoryItem>();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const partVal = colPart ? String(row[colPart] ?? '').trim() : '';
    if (!partVal) continue;

    const onHandVal = colOnHand && row[colOnHand] !== '' ? Number(row[colOnHand]) : 0;
    const availVal = colAvailable && row[colAvailable] !== '' ? Number(row[colAvailable]) : onHandVal;
    const committedVal = colCommitted && row[colCommitted] !== '' ? Number(row[colCommitted]) : 0;
    const safetyVal = colSafety && row[colSafety] !== '' ? Number(row[colSafety]) : 0;
    const costVal = colCost && row[colCost] !== '' ? Number(row[colCost]) : 0;
    const leadVal = colLead && row[colLead] !== '' ? Number(row[colLead]) : 7;
    const descVal = colDesc ? String(row[colDesc] ?? '').trim() : '';
    const locVal = colLocation ? String(row[colLocation] ?? '').trim() : '';
    const binVal = colBin ? String(row[colBin] ?? '').trim() : '';

    const validOnHand = isNaN(onHandVal) ? 0 : onHandVal;
    const validAvail = isNaN(availVal) ? validOnHand : availVal;
    const validCommitted = isNaN(committedVal) ? 0 : committedVal;

    if (itemMap.has(partVal)) {
      const existing = itemMap.get(partVal)!;
      existing.onHand += validOnHand;
      existing.available = (existing.available ?? existing.onHand) + validAvail;
      existing.committed = (existing.committed ?? 0) + validCommitted;
      if (!existing.description && descVal) existing.description = descVal;
      if (binVal && !existing.binNumber?.includes(binVal)) {
        existing.binNumber = existing.binNumber ? `${existing.binNumber}, ${binVal}` : binVal;
      }
    } else {
      itemMap.set(partVal, {
        partNumber: partVal,
        description: descVal,
        onHand: validOnHand,
        available: validAvail,
        committed: validCommitted,
        location: locVal,
        binNumber: binVal,
        safetyStock: isNaN(safetyVal) ? 0 : safetyVal,
        unitCost: isNaN(costVal) ? 0 : costVal,
        leadTimeDays: isNaN(leadVal) ? 7 : leadVal,
        unit: colUnit ? String(row[colUnit] ?? 'EA') : 'EA',
      });
    }
  }

  const result = Array.from(itemMap.values());

  return {
    data: result,
    fileName,
    headers: rawHeaders,
    totalRows: result.length,
    errors,
  };
}
