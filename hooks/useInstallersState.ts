import { useReducer, Dispatch, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import {
  BaseEntityListState,
  BaseEntityListAction,
  EntityListConfig,
  BaseDateFilters,
  createEntityListReducer,
  createInitialState,
} from "./useEntityListState";

// Installer-specific column visibility
export interface InstallerColumnVisibility {
  installerCode: boolean;
  fullName: boolean;
  cnic: boolean;
  phoneNumber: boolean;
  city: boolean;
  province: boolean;
  district: boolean;
  companyName: boolean;
  certified: boolean;
  bankName: boolean;
  accountNumber: boolean;
}

// Installer-specific filters extending base date filters
export interface InstallerFilters extends BaseDateFilters {
  city: string;
  province: string;
  district: string;
  certified: string;
}

// Initial values
const initialFilters: InstallerFilters = {
  city: "",
  province: "",
  district: "",
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
  district: false,
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

// Installer-specific action types (not in base)
type InstallerSpecificAction =
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

// Extended action type combining base and installer-specific actions
export type InstallersAction =
  | BaseEntityListAction<InstallerFilters, InstallerColumnVisibility>
  | InstallerSpecificAction;

// Initial installer-specific state additions
const installerSpecificInitialState = {
  search: "",
  showFilters: false,
  dateRangePicker: undefined as DateRange | undefined,
  isCustomDateOpen: false,
};

// Create initial state by combining base state with installer-specific state
export const initialState: InstallersState = {
  ...createInitialState(installersConfig),
  ...installerSpecificInitialState,
};

// Get the base reducer
const baseReducer = createEntityListReducer(installersConfig);

/**
 * Reducer that composes base entity list reducer with installer-specific actions.
 * This eliminates duplication by delegating common actions to the base reducer.
 */
function installersReducer(
  state: InstallersState,
  action: InstallersAction
): InstallersState {
  // Handle installer-specific actions first
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

    // Legacy action aliases (map to base actions for backwards compatibility)
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

    // Special handling for RESET_FILTERS to also reset dateRangePicker
    case "RESET_FILTERS": {
      const baseResult = baseReducer(state, action);
      return {
        ...state,
        ...baseResult,
        dateRangePicker: undefined,
      };
    }

    // Delegate all other actions to the base reducer
    default: {
      // Cast to base action type for the base reducer
      const baseAction = action as BaseEntityListAction<
        InstallerFilters,
        InstallerColumnVisibility
      >;
      const baseResult = baseReducer(state, baseAction);
      // Preserve installer-specific state when base reducer handles the action
      return {
        ...baseResult,
        search: state.search,
        showFilters: state.showFilters,
        dateRangePicker: state.dateRangePicker,
        isCustomDateOpen: state.isCustomDateOpen,
      };
    }
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
