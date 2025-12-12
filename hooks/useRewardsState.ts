import { useReducer, Dispatch } from "react";
import {
  BaseEntityListState,
  BaseEntityListAction,
  BaseDateFilters,
} from "./useEntityListState";

// Rewards-specific column visibility
export interface RewardsColumnVisibility {
  serialNumber: boolean;
  installerCode: boolean;
  installer: boolean;
  productModel: boolean;
  cityOfInstallation: boolean;
  rewardAmount: boolean;
  rewardStatus: boolean;
  paymentMethod: boolean;
  transactionId: boolean;
  sendingDate: boolean;
  inverterSerialNumber: boolean;
  registeredBy: boolean;
  referrerName: boolean;
  referrerTransactionId: boolean;
  referrerReward: boolean;
}

// Rewards-specific filters extending base date filters
export interface RewardsFilters extends BaseDateFilters {
  rewardStatus: string;
  sendingDate: string;
  paymentMethod: string;
  serialNumberStatus: string;
  productModel: string;
  teamMember: string;
  search: string;
  updatedAt: string;
}

// Initial values
const initialFilters: RewardsFilters = {
  rewardStatus: "ALL",
  sendingDate: "",
  paymentMethod: "all",
  serialNumberStatus: "all",
  productModel: "all",
  teamMember: "all",
  search: "",
  dateRange: "all",
  customStartDate: "",
  customEndDate: "",
  updatedAt: "",
};

const initialColumnVisibility: RewardsColumnVisibility = {
  serialNumber: true,
  installerCode: false,
  installer: true,
  productModel: true,
  cityOfInstallation: false,
  rewardAmount: true,
  rewardStatus: true,
  paymentMethod: false,
  transactionId: false,
  sendingDate: false,
  inverterSerialNumber: false,
  registeredBy: false,
  referrerName: false,
  referrerTransactionId: false,
  referrerReward: false,
};

// Extended state type with rewards-specific additions
export interface RewardsState
  extends BaseEntityListState<RewardsFilters, RewardsColumnVisibility> {
  // Rewards-specific UI state
  bulkDeleting: boolean;
  // Backwards compatibility aliases
  selectedRewards: Set<string>;
  selectedRewardId: string;
}

// Extended action type for rewards-specific actions
export type RewardsAction =
  | BaseEntityListAction<RewardsFilters, RewardsColumnVisibility>
  // Legacy action aliases for backwards compatibility
  | { type: "SELECT_REWARD"; payload: string }
  | { type: "DESELECT_REWARD"; payload: string }
  | { type: "SELECT_ALL_REWARDS"; payload: string[] }
  | { type: "DESELECT_ALL_REWARDS"; payload: string[] }
  | { type: "TOGGLE_REWARD_SELECTION"; payload: string }
  // Rewards-specific actions
  | { type: "SET_BULK_DELETING"; payload: boolean };

// Create initial state
export const initialState: RewardsState = {
  filters: initialFilters,
  sortField: "createdAt",
  sortDirection: "desc",
  currentPage: 1,
  itemsPerPage: 10,
  visibleColumns: initialColumnVisibility,
  selectedItems: new Set(),
  editModalOpen: false,
  selectedItemId: "",
  // Backwards compatibility aliases
  selectedRewards: new Set(),
  selectedRewardId: "",
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
  // Rewards-specific state
  bulkDeleting: false,
};

function rewardsReducer(
  state: RewardsState,
  action: RewardsAction
): RewardsState {
  switch (action.type) {
    // Rewards-specific actions
    case "SET_BULK_DELETING":
      return { ...state, bulkDeleting: action.payload };

    // Legacy action aliases (map to base actions)
    case "SELECT_REWARD":
      return {
        ...state,
        selectedItems: new Set([...state.selectedItems, action.payload]),
      };

    case "DESELECT_REWARD": {
      const newSelection = new Set(state.selectedItems);
      newSelection.delete(action.payload);
      return { ...state, selectedItems: newSelection };
    }

    case "SELECT_ALL_REWARDS":
      return {
        ...state,
        selectedItems: new Set([...state.selectedItems, ...action.payload]),
      };

    case "DESELECT_ALL_REWARDS": {
      const newSelection = new Set(state.selectedItems);
      action.payload.forEach((id) => newSelection.delete(id));
      return { ...state, selectedItems: newSelection };
    }

    case "TOGGLE_REWARD_SELECTION": {
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
        currentPage: 1,
        // Reset sort to default if it's on updatedAt
        sortField:
          state.sortField === "updatedAt" ? "createdAt" : state.sortField,
        sortDirection:
          state.sortField === "updatedAt" ? "desc" : state.sortDirection,
      };

    case "SET_SORT":
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction,
      };

    case "TOGGLE_SORT":
      if (state.sortField === action.payload) {
        // Clicking the same field
        if (action.payload === "createdAt") {
          // For date fields: only toggle between asc and desc (no reset)
          return {
            ...state,
            sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
          };
        } else {
          // For other fields: cycle through asc -> desc -> reset to default
          if (state.sortDirection === "asc") {
            return { ...state, sortDirection: "desc" };
          } else {
            // Reset to default sort (createdAt desc)
            return { ...state, sortField: "createdAt", sortDirection: "desc" };
          }
        }
      } else {
        // Clicking a new field: start with ascending
        return { ...state, sortField: action.payload, sortDirection: "asc" };
      }

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
              action.payload as keyof RewardsColumnVisibility
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
export type { RewardsColumnVisibility as ColumnVisibility };
export type { RewardsFilters as Filters };

// Wrapper type that adds backwards compatibility aliases
type RewardsStateWithAliases = Omit<
  RewardsState,
  "selectedRewards" | "selectedRewardId"
> & {
  selectedRewards: Set<string>;
  selectedRewardId: string;
};

export function useRewardsState(): [
  RewardsStateWithAliases,
  Dispatch<RewardsAction>
] {
  const [state, dispatch] = useReducer(rewardsReducer, initialState);

  // Create state with backwards compatibility aliases (computed from base properties)
  const stateWithAliases: RewardsStateWithAliases = {
    ...state,
    selectedRewards: state.selectedItems,
    selectedRewardId: state.selectedItemId,
  };

  return [stateWithAliases, dispatch];
}
