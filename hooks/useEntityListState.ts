import { useReducer, Dispatch, useCallback, useMemo } from "react";

/**
 * Generic entity list state hook that provides common functionality for
 * list pages including filtering, sorting, pagination, column visibility,
 * selection, and modal state.
 *
 * This hook consolidates shared patterns from useInstallersState and useRewardsState.
 */

// Base filter interface with required date fields
export interface BaseDateFilters {
  dateRange: "all" | "today" | "week" | "month" | "year" | "custom";
  customStartDate: string;
  customEndDate: string;
}

// Delete dialog state structure
export interface DeleteDialogState {
  open: boolean;
  status: "confirm" | "deleting" | "success" | "error";
  message?: string;
  entityId?: string;
  entityName?: string;
  // Backwards compatibility aliases for entity-specific field names
  rewardId?: string;
  rewardSerialNumber?: string;
  installerId?: string;
  installerName?: string;
}

// Bulk delete result state structure
export interface BulkDeleteResultState {
  open: boolean;
  status: "confirm" | "deleting" | "success" | "error";
  successCount: number;
  failCount: number;
  failures: Array<{ name: string; reason: string }>;
  message?: string;
}

// Base state that all entity lists share
export interface BaseEntityListState<TFilters, TColumns> {
  // Filtering
  filters: TFilters;

  // Sorting
  sortField: string;
  sortDirection: "asc" | "desc";

  // Pagination
  currentPage: number;
  itemsPerPage: number;

  // Column visibility
  visibleColumns: TColumns;

  // Selection
  selectedItems: Set<string>;

  // Modal state
  editModalOpen: boolean;
  selectedItemId: string;

  // Delete dialog state
  deleteDialogState: DeleteDialogState;

  // Bulk delete state
  bulkDeleteResultState: BulkDeleteResultState;

  // UI state
  deletingId: string | null;
  downloadingReport: boolean;
}

// Base action types shared across all entity lists
export type BaseEntityListAction<TFilters, TColumns> =
  // Filter actions
  | { type: "SET_FILTER"; payload: { key: keyof TFilters; value: string } }
  | { type: "SET_FILTERS"; payload: Partial<TFilters> }
  | { type: "RESET_FILTERS" }
  // Sort actions
  | { type: "SET_SORT"; payload: { field: string; direction: "asc" | "desc" } }
  | { type: "TOGGLE_SORT"; payload: string }
  // Pagination actions
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "RESET_TO_PAGE_ONE" }
  // Column visibility actions
  | { type: "TOGGLE_COLUMN"; payload: keyof TColumns }
  | { type: "SET_COLUMNS"; payload: Partial<TColumns> }
  // Selection actions
  | { type: "SELECT_ITEM"; payload: string }
  | { type: "DESELECT_ITEM"; payload: string }
  | { type: "SELECT_ALL_ITEMS"; payload: string[] }
  | { type: "DESELECT_ALL_ITEMS"; payload: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "TOGGLE_ITEM_SELECTION"; payload: string }
  // Modal actions
  | { type: "OPEN_EDIT_MODAL"; payload: string }
  | { type: "CLOSE_EDIT_MODAL" }
  // Delete dialog actions
  | { type: "SET_DELETE_DIALOG_STATE"; payload: Partial<DeleteDialogState> }
  | { type: "RESET_DELETE_DIALOG" }
  // Bulk delete actions
  | {
      type: "SET_BULK_DELETE_RESULT_STATE";
      payload: Partial<BulkDeleteResultState>;
    }
  | { type: "RESET_BULK_DELETE_RESULT" }
  // UI state actions
  | { type: "SET_DELETING_ID"; payload: string | null }
  | { type: "SET_DOWNLOADING_REPORT"; payload: boolean };

// Configuration for creating an entity list state
export interface EntityListConfig<TFilters, TColumns> {
  initialFilters: TFilters;
  initialColumns: TColumns;
  defaultSortField?: string;
  defaultSortDirection?: "asc" | "desc";
  defaultItemsPerPage?: number;
  // Custom reset filters behavior (e.g., resetting sort when specific field is active)
  onResetFilters?: (
    state: BaseEntityListState<TFilters, TColumns>
  ) => Partial<BaseEntityListState<TFilters, TColumns>>;
  // Custom toggle sort behavior for specific fields
  customSortBehavior?: (
    state: BaseEntityListState<TFilters, TColumns>,
    field: string
  ) => Partial<BaseEntityListState<TFilters, TColumns>> | null;
}

// Create initial state from config
function createInitialState<TFilters, TColumns>(
  config: EntityListConfig<TFilters, TColumns>
): BaseEntityListState<TFilters, TColumns> {
  return {
    filters: config.initialFilters,
    sortField: config.defaultSortField ?? "createdAt",
    sortDirection: config.defaultSortDirection ?? "desc",
    currentPage: 1,
    itemsPerPage: config.defaultItemsPerPage ?? 10,
    visibleColumns: config.initialColumns,
    selectedItems: new Set(),
    editModalOpen: false,
    selectedItemId: "",
    deleteDialogState: {
      open: false,
      status: "confirm",
    },
    bulkDeleteResultState: {
      open: false,
      status: "confirm",
      successCount: 0,
      failCount: 0,
      failures: [],
    },
    deletingId: null,
    downloadingReport: false,
  };
}

// Create the reducer for entity list state
function createEntityListReducer<TFilters, TColumns>(
  config: EntityListConfig<TFilters, TColumns>
) {
  const initialState = createInitialState(config);

  return function reducer(
    state: BaseEntityListState<TFilters, TColumns>,
    action: BaseEntityListAction<TFilters, TColumns>
  ): BaseEntityListState<TFilters, TColumns> {
    switch (action.type) {
      // Filter actions
      case "SET_FILTER":
        return {
          ...state,
          filters: {
            ...state.filters,
            [action.payload.key]: action.payload.value,
          },
          currentPage: 1,
        };

      case "SET_FILTERS":
        return {
          ...state,
          filters: {
            ...state.filters,
            ...action.payload,
          },
          currentPage: 1,
        };

      case "RESET_FILTERS": {
        const baseReset = {
          ...state,
          filters: config.initialFilters,
          currentPage: 1,
        };
        // Apply custom reset behavior if provided
        if (config.onResetFilters) {
          return { ...baseReset, ...config.onResetFilters(state) };
        }
        return baseReset;
      }

      // Sort actions
      case "SET_SORT":
        return {
          ...state,
          sortField: action.payload.field,
          sortDirection: action.payload.direction,
        };

      case "TOGGLE_SORT": {
        // Check for custom sort behavior first
        if (config.customSortBehavior) {
          const customResult = config.customSortBehavior(state, action.payload);
          if (customResult) {
            return { ...state, ...customResult };
          }
        }

        // Default toggle behavior
        if (state.sortField === action.payload) {
          if (state.sortDirection === "asc") {
            return { ...state, sortDirection: "desc" };
          } else {
            // Reset to default sort
            return {
              ...state,
              sortField: config.defaultSortField ?? "createdAt",
              sortDirection: config.defaultSortDirection ?? "desc",
            };
          }
        } else {
          return {
            ...state,
            sortField: action.payload,
            sortDirection: "asc",
          };
        }
      }

      // Pagination actions
      case "SET_PAGE":
        return { ...state, currentPage: action.payload };

      case "SET_ITEMS_PER_PAGE":
        return {
          ...state,
          itemsPerPage: action.payload,
          currentPage: 1,
        };

      case "RESET_TO_PAGE_ONE":
        return { ...state, currentPage: 1 };

      // Column visibility actions
      case "TOGGLE_COLUMN":
        return {
          ...state,
          visibleColumns: {
            ...state.visibleColumns,
            [action.payload]:
              !state.visibleColumns[action.payload as keyof TColumns],
          },
        };

      case "SET_COLUMNS":
        return {
          ...state,
          visibleColumns: {
            ...state.visibleColumns,
            ...action.payload,
          },
        };

      // Selection actions
      case "SELECT_ITEM":
        return {
          ...state,
          selectedItems: new Set([...state.selectedItems, action.payload]),
        };

      case "DESELECT_ITEM": {
        const newSelection = new Set(state.selectedItems);
        newSelection.delete(action.payload);
        return { ...state, selectedItems: newSelection };
      }

      case "SELECT_ALL_ITEMS":
        return {
          ...state,
          selectedItems: new Set([...state.selectedItems, ...action.payload]),
        };

      case "DESELECT_ALL_ITEMS": {
        const newSelection = new Set(state.selectedItems);
        action.payload.forEach((id) => newSelection.delete(id));
        return { ...state, selectedItems: newSelection };
      }

      case "CLEAR_SELECTION":
        return { ...state, selectedItems: new Set() };

      case "TOGGLE_ITEM_SELECTION": {
        const newSelection = new Set(state.selectedItems);
        if (newSelection.has(action.payload)) {
          newSelection.delete(action.payload);
        } else {
          newSelection.add(action.payload);
        }
        return { ...state, selectedItems: newSelection };
      }

      // Modal actions
      case "OPEN_EDIT_MODAL":
        return {
          ...state,
          editModalOpen: true,
          selectedItemId: action.payload,
        };

      case "CLOSE_EDIT_MODAL":
        return {
          ...state,
          editModalOpen: false,
          selectedItemId: "",
        };

      // Delete dialog actions
      case "SET_DELETE_DIALOG_STATE":
        return {
          ...state,
          deleteDialogState: {
            ...state.deleteDialogState,
            ...action.payload,
          },
        };

      case "RESET_DELETE_DIALOG":
        return {
          ...state,
          deleteDialogState: {
            open: false,
            status: "confirm",
          },
        };

      // Bulk delete actions
      case "SET_BULK_DELETE_RESULT_STATE":
        return {
          ...state,
          bulkDeleteResultState: {
            ...state.bulkDeleteResultState,
            ...action.payload,
          },
        };

      case "RESET_BULK_DELETE_RESULT":
        return {
          ...state,
          bulkDeleteResultState: {
            open: false,
            status: "confirm",
            successCount: 0,
            failCount: 0,
            failures: [],
          },
        };

      // UI state actions
      case "SET_DELETING_ID":
        return { ...state, deletingId: action.payload };

      case "SET_DOWNLOADING_REPORT":
        return { ...state, downloadingReport: action.payload };

      default:
        return state;
    }
  };
}

// Hook return type with helper functions
export interface UseEntityListStateReturn<TFilters, TColumns> {
  state: BaseEntityListState<TFilters, TColumns>;
  dispatch: Dispatch<BaseEntityListAction<TFilters, TColumns>>;
  // Helper functions for common operations
  helpers: {
    setFilter: (key: keyof TFilters, value: string) => void;
    resetFilters: () => void;
    toggleSort: (field: string) => void;
    setPage: (page: number) => void;
    toggleColumn: (column: keyof TColumns) => void;
    toggleSelection: (id: string) => void;
    selectAll: (ids: string[]) => void;
    deselectAll: (ids: string[]) => void;
    clearSelection: () => void;
    openEditModal: (id: string) => void;
    closeEditModal: () => void;
  };
}

/**
 * Generic hook for entity list state management.
 * Consolidates common patterns from list pages.
 */
export function useEntityListState<TFilters, TColumns>(
  config: EntityListConfig<TFilters, TColumns>
): UseEntityListStateReturn<TFilters, TColumns> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialState = useMemo(() => createInitialState(config), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reducer = useMemo(() => createEntityListReducer(config), []);

  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoized helper functions
  const helpers = useMemo(
    () => ({
      setFilter: (key: keyof TFilters, value: string) =>
        dispatch({ type: "SET_FILTER", payload: { key, value } }),
      resetFilters: () => dispatch({ type: "RESET_FILTERS" }),
      toggleSort: (field: string) =>
        dispatch({ type: "TOGGLE_SORT", payload: field }),
      setPage: (page: number) => dispatch({ type: "SET_PAGE", payload: page }),
      toggleColumn: (column: keyof TColumns) =>
        dispatch({ type: "TOGGLE_COLUMN", payload: column }),
      toggleSelection: (id: string) =>
        dispatch({ type: "TOGGLE_ITEM_SELECTION", payload: id }),
      selectAll: (ids: string[]) =>
        dispatch({ type: "SELECT_ALL_ITEMS", payload: ids }),
      deselectAll: (ids: string[]) =>
        dispatch({ type: "DESELECT_ALL_ITEMS", payload: ids }),
      clearSelection: () => dispatch({ type: "CLEAR_SELECTION" }),
      openEditModal: (id: string) =>
        dispatch({ type: "OPEN_EDIT_MODAL", payload: id }),
      closeEditModal: () => dispatch({ type: "CLOSE_EDIT_MODAL" }),
    }),
    [dispatch]
  );

  return { state, dispatch, helpers };
}

export { createInitialState, createEntityListReducer };
