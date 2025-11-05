import { useReducer, Dispatch } from "react";
import type { DateRange } from "react-day-picker";

export interface ColumnVisibility {
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

export interface Filters {
  city: string;
  province: string;
  trainingCenter: string;
  certified: string;
  dateRange: "all" | "today" | "week" | "month" | "year" | "custom";
  customStartDate: string;
  customEndDate: string;
}

export interface InstallersState {
  // Search and filtering
  search: string;
  filters: Filters;
  showFilters: boolean;
  dateRange: DateRange | undefined;
  isCustomDateOpen: boolean;

  // Sorting
  sortField: string;
  sortDirection: "asc" | "desc";

  // Pagination
  currentPage: number;
  rowsPerPage: number;

  // Column visibility
  visibleColumns: ColumnVisibility;

  // Selection
  selectedInstallers: Set<string>;

  // Modal state
  editModalOpen: boolean;
  selectedInstallerId: string;
}

export type InstallersAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTER"; payload: { key: keyof Filters; value: string } }
  | { type: "SET_FILTERS"; payload: Partial<Filters> }
  | { type: "RESET_FILTERS" }
  | { type: "TOGGLE_FILTERS" }
  | { type: "SET_DATE_RANGE"; payload: DateRange | undefined }
  | { type: "SET_CUSTOM_DATE_OPEN"; payload: boolean }
  | { type: "SET_SORT"; payload: { field: string; direction: "asc" | "desc" } }
  | { type: "TOGGLE_SORT"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ROWS_PER_PAGE"; payload: number }
  | { type: "TOGGLE_COLUMN"; payload: keyof ColumnVisibility }
  | { type: "SET_COLUMNS"; payload: Partial<ColumnVisibility> }
  | { type: "SELECT_INSTALLER"; payload: string }
  | { type: "DESELECT_INSTALLER"; payload: string }
  | { type: "SELECT_ALL_INSTALLERS"; payload: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "TOGGLE_INSTALLER_SELECTION"; payload: string }
  | { type: "OPEN_EDIT_MODAL"; payload: string }
  | { type: "CLOSE_EDIT_MODAL" }
  | { type: "RESET_TO_PAGE_ONE" };

const initialFilters: Filters = {
  city: "",
  province: "",
  trainingCenter: "",
  certified: "",
  dateRange: "all",
  customStartDate: "",
  customEndDate: "",
};

const initialColumnVisibility: ColumnVisibility = {
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

export const initialState: InstallersState = {
  search: "",
  filters: initialFilters,
  showFilters: false,
  dateRange: undefined,
  isCustomDateOpen: false,
  sortField: "createdAt",
  sortDirection: "desc",
  currentPage: 1,
  rowsPerPage: 10,
  visibleColumns: initialColumnVisibility,
  selectedInstallers: new Set(),
  editModalOpen: false,
  selectedInstallerId: "",
};

function installersReducer(
  state: InstallersState,
  action: InstallersAction
): InstallersState {
  switch (action.type) {
    case "SET_SEARCH":
      return {
        ...state,
        search: action.payload,
        currentPage: 1, // Reset to first page on search
      };

    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
        currentPage: 1, // Reset to first page on filter
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

    case "RESET_FILTERS":
      return {
        ...state,
        filters: initialFilters,
        dateRange: undefined,
        currentPage: 1,
      };

    case "TOGGLE_FILTERS":
      return {
        ...state,
        showFilters: !state.showFilters,
      };

    case "SET_DATE_RANGE":
      return {
        ...state,
        dateRange: action.payload,
      };

    case "SET_CUSTOM_DATE_OPEN":
      return {
        ...state,
        isCustomDateOpen: action.payload,
      };

    case "SET_SORT":
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction,
      };

    case "TOGGLE_SORT":
      if (state.sortField === action.payload) {
        // Toggle direction if same field
        return {
          ...state,
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        };
      } else {
        // New field, default to ascending
        return {
          ...state,
          sortField: action.payload,
          sortDirection: "asc",
        };
      }

    case "SET_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };

    case "SET_ROWS_PER_PAGE":
      return {
        ...state,
        rowsPerPage: action.payload,
        currentPage: 1, // Reset to first page when changing rows per page
      };

    case "TOGGLE_COLUMN":
      return {
        ...state,
        visibleColumns: {
          ...state.visibleColumns,
          [action.payload]: !state.visibleColumns[action.payload],
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

    case "SELECT_INSTALLER":
      return {
        ...state,
        selectedInstallers: new Set([
          ...state.selectedInstallers,
          action.payload,
        ]),
      };

    case "DESELECT_INSTALLER": {
      const newSelection = new Set(state.selectedInstallers);
      newSelection.delete(action.payload);
      return {
        ...state,
        selectedInstallers: newSelection,
      };
    }

    case "SELECT_ALL_INSTALLERS":
      return {
        ...state,
        selectedInstallers: new Set(action.payload),
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedInstallers: new Set(),
      };

    case "TOGGLE_INSTALLER_SELECTION": {
      const newSelection = new Set(state.selectedInstallers);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return {
        ...state,
        selectedInstallers: newSelection,
      };
    }

    case "OPEN_EDIT_MODAL":
      return {
        ...state,
        editModalOpen: true,
        selectedInstallerId: action.payload,
      };

    case "CLOSE_EDIT_MODAL":
      return {
        ...state,
        editModalOpen: false,
        selectedInstallerId: "",
      };

    case "RESET_TO_PAGE_ONE":
      return {
        ...state,
        currentPage: 1,
      };

    default:
      return state;
  }
}

export function useInstallersState(): [
  InstallersState,
  Dispatch<InstallersAction>
] {
  return useReducer(installersReducer, initialState);
}
