import { useReducer, Dispatch } from "react";
import type { DateRange } from "react-day-picker";
import {
  useEntityListState,
  BaseEntityListState,
  BaseEntityListAction,
  EntityListConfig,
  BaseDateFilters,
} from "./useEntityListState";

// Installer-specific column visibility
export interface InstallerColumnVisibility {
  installerCode: boolean;
  fullName: boolean;
  cnic: boolean;
  phoneNumber: boolean;
  city: boolean;
  province: boolean;
  trainingCenter: boolean;
  companyName: boolean;
  certified: boolean;
  bankName: boolean;
  accountNumber: boolean;
}

// Installer-specific filters extending base date filters
export interface InstallerFilters extends BaseDateFilters {
  city: string;
  province: string;
  trainingCenter: string;
  certified: string;
}

// Initial values
const initialFilters: InstallerFilters = {
  city: "",
  province: "",
  trainingCenter: "",
  certified: "",
  dateRange: "all",
  customStartDate: "",
  customEndDate: "",
};

const initialColumnVisibility: InstallerColumnVisibility = {
  installerCode: true,
  fullName: true,
  cnic: true,
  phoneNumber: true,
  city: true,
  province: false,
  trainingCenter: false,
  companyName: false,
  certified: true,
  bankName: false,
  accountNumber: false,
};

// Configuration for installers entity list
const installersConfig: EntityListConfig<
  InstallerFilters,
  InstallerColumnVisibility
> = {
  initialFilters,
  initialColumns: initialColumnVisibility,
  defaultSortField: "createdAt",
  defaultSortDirection: "desc",
  defaultItemsPerPage: 10,
};

// Extended state type with installer-specific additions
export interface InstallersState
  extends BaseEntityListState<InstallerFilters, InstallerColumnVisibility> {
  // Additional installer-specific state
  search: string;
  showFilters: boolean;
  dateRangePicker: DateRange | undefined;
  isCustomDateOpen: boolean;
}

// Extended action type for installer-specific actions
export type InstallersAction =
  | BaseEntityListAction<InstallerFilters, InstallerColumnVisibility>
  | { type: "SET_SEARCH"; payload: string }
  | { type: "TOGGLE_FILTERS" }
  | { type: "SET_DATE_RANGE_PICKER"; payload: DateRange | undefined }
  | { type: "SET_CUSTOM_DATE_OPEN"; payload: boolean }
  // Legacy action aliases for backwards compatibility
  | { type: "SET_ROWS_PER_PAGE"; payload: number }
  | { type: "SELECT_INSTALLER"; payload: string }
  | { type: "DESELECT_INSTALLER"; payload: string }
  | { type: "SELECT_ALL_INSTALLERS"; payload: string[] }
  | { type: "TOGGLE_INSTALLER_SELECTION"; payload: string };

// Create initial state
export const initialState: InstallersState = {
  filters: initialFilters,
  sortField: "createdAt",
  sortDirection: "desc",
  currentPage: 1,
  itemsPerPage: 10,
  visibleColumns: initialColumnVisibility,
  selectedItems: new Set(),
  editModalOpen: false,
  selectedItemId: "",
  deleteDialogState: { open: false, status: "confirm" },
  bulkDeleteResultState: {
    open: false,
    status: "confirm",
    successCount: 0,
    failCount: 0,
    failures: [],
  },
  deletingId: null,
  downloadingReport: false,
  // Installer-specific state
  search: "",
  showFilters: false,
  dateRangePicker: undefined,
  isCustomDateOpen: false,
};

function installersReducer(
  state: InstallersState,
  action: InstallersAction
): InstallersState {
  switch (action.type) {
    // Installer-specific actions
    case "SET_SEARCH":
      return {
        ...state,
        search: action.payload,
        currentPage: 1,
      };

    case "TOGGLE_FILTERS":
      return { ...state, showFilters: !state.showFilters };

    case "SET_DATE_RANGE_PICKER":
      return { ...state, dateRangePicker: action.payload };

    case "SET_CUSTOM_DATE_OPEN":
      return { ...state, isCustomDateOpen: action.payload };

    // Legacy action aliases (map to base actions)
    case "SET_ROWS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };

    case "SELECT_INSTALLER":
      return {
        ...state,
        selectedItems: new Set([...state.selectedItems, action.payload]),
      };

    case "DESELECT_INSTALLER": {
      const newSelection = new Set(state.selectedItems);
      newSelection.delete(action.payload);
      return { ...state, selectedItems: newSelection };
    }

    case "SELECT_ALL_INSTALLERS":
      return { ...state, selectedItems: new Set(action.payload) };

    case "TOGGLE_INSTALLER_SELECTION": {
      const newSelection = new Set(state.selectedItems);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return { ...state, selectedItems: newSelection };
    }

    // Base entity list actions
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
        filters: { ...state.filters, ...action.payload },
        currentPage: 1,
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: initialFilters,
        dateRangePicker: undefined,
        currentPage: 1,
      };

    case "SET_SORT":
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction,
      };

    case "TOGGLE_SORT":
      if (state.sortField === action.payload) {
        return {
          ...state,
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        };
      }
      return {
        ...state,
        sortField: action.payload,
        sortDirection: "asc",
      };

    case "SET_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_ITEMS_PER_PAGE":
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };

    case "RESET_TO_PAGE_ONE":
      return { ...state, currentPage: 1 };

    case "TOGGLE_COLUMN":
      return {
        ...state,
        visibleColumns: {
          ...state.visibleColumns,
          [action.payload]:
            !state.visibleColumns[
              action.payload as keyof InstallerColumnVisibility
            ],
        },
      };

    case "SET_COLUMNS":
      return {
        ...state,
        visibleColumns: { ...state.visibleColumns, ...action.payload },
      };

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

    case "OPEN_EDIT_MODAL":
      return { ...state, editModalOpen: true, selectedItemId: action.payload };

    case "CLOSE_EDIT_MODAL":
      return { ...state, editModalOpen: false, selectedItemId: "" };

    case "SET_DELETE_DIALOG_STATE":
      return {
        ...state,
        deleteDialogState: { ...state.deleteDialogState, ...action.payload },
      };

    case "RESET_DELETE_DIALOG":
      return {
        ...state,
        deleteDialogState: { open: false, status: "confirm" },
      };

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

    case "SET_DELETING_ID":
      return { ...state, deletingId: action.payload };

    case "SET_DOWNLOADING_REPORT":
      return { ...state, downloadingReport: action.payload };

    default:
      return state;
  }
}

// Export types for backwards compatibility
export type { InstallerColumnVisibility as ColumnVisibility };
export type { InstallerFilters as Filters };

// Alias for backwards compatibility
export { initialState as installersInitialState };

export function useInstallersState(): [
  InstallersState,
  Dispatch<InstallersAction>
] {
  return useReducer(installersReducer, initialState);
}
