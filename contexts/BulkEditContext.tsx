import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface BulkEditConfig {
  label: string;
  onPress: (rows: any[]) => void;
  /** When provided, View Invoice in sidebar is enabled when exactly 1 row selected */
  viewSingleItem?: (row: any) => void;
}

interface BulkEditContextType {
  /** Current bulk edit config from active page (null when page doesn't support) */
  config: BulkEditConfig | null;
  /** Number of selected rows */
  selectedCount: number;
  /** Selected row data for passing to onPress */
  selectedRows: any[];
  /** Called by pages to register their bulk edit (cleanup on unmount) */
  setConfig: (config: BulkEditConfig | null) => void;
  /** Called when selection changes (from DataTable onSelectionChange) */
  setSelection: (rows: any[]) => void;
  /** Trigger the bulk edit action (called by sidebar) */
  triggerBulkEdit: () => void;
}

const BulkEditContext = createContext<BulkEditContextType | null>(null);

/**
 * BulkEditProvider - Connects sidebar Edit button with page bulk edit.
 * Pages register their bulk edit config; sidebar reads selection state.
 */
export function BulkEditProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<BulkEditConfig | null>(null);
  const [selectedRows, setSelectedRowsState] = useState<any[]>([]);
  const configRef = useRef<BulkEditConfig | null>(null);
  const selectedRowsRef = useRef<any[]>([]);

  const setConfig = useCallback((next: BulkEditConfig | null) => {
    configRef.current = next;
    setConfigState(next);
    // 切换页面时清除选择，避免残留
    selectedRowsRef.current = [];
    setSelectedRowsState([]);
  }, []);

  const setSelection = useCallback((rows: any[]) => {
    selectedRowsRef.current = rows;
    setSelectedRowsState(rows);
  }, []);

  const triggerBulkEdit = useCallback(() => {
    const cfg = configRef.current;
    const rows = selectedRowsRef.current;
    if (cfg && rows.length > 0) {
      cfg.onPress(rows);
    }
  }, []);

  return (
    <BulkEditContext.Provider
      value={{
        config,
        selectedCount: selectedRows.length,
        selectedRows,
        setConfig,
        setSelection,
        triggerBulkEdit,
      }}
    >
      {children}
    </BulkEditContext.Provider>
  );
}

export function useBulkEditContext() {
  const ctx = useContext(BulkEditContext);
  if (!ctx) {
    throw new Error("useBulkEditContext must be used within BulkEditProvider");
  }
  return ctx;
}
