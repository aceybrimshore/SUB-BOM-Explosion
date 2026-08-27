import { BOMRawRecord, BuildScheduleRecord, InventoryItem, BOMMode } from '../types/bom';

const STORAGE_KEY = 'BOM_MRP_PERSISTED_STATE_V1';

export interface PersistedState {
  bomSource: BOMRawRecord[];
  buildSchedule: BuildScheduleRecord[];
  inventory: InventoryItem[];
  bomFileName: string;
  scheduleFileName: string;
  inventoryFileName: string;
  mode: BOMMode;
  defaultBuildQty: number;
  qtyOverrides?: Record<string, number>;
  deletedRowIds?: string[];
  lastSavedAt: string;
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.bomSource) &&
      Array.isArray(parsed.buildSchedule) &&
      Array.isArray(parsed.inventory)
    ) {
      return parsed as PersistedState;
    }
  } catch (err) {
    console.warn('Failed to load persisted state from localStorage:', err);
  }
  return null;
}

export function savePersistedState(
  state: Omit<PersistedState, 'lastSavedAt'>
): string | null {
  try {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const payload: PersistedState = {
      ...state,
      lastSavedAt: timeStr,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return timeStr;
  } catch (err) {
    console.warn('Failed to auto-save state to localStorage:', err);
    return null;
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear persisted state:', err);
  }
}
