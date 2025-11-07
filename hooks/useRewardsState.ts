import { useReducer, Dispatch } from "react";

export interface ColumnVisibility {
  serialNumber: boolean;
  installerCode: boolean;
  installer: boolean;
  productModel: boolean;
  cityOfInstallation: boolean;
  rewardAmount: boolean;
  paymentStatus: boolean;
  paymentMethod: boolean;
  transactionId: boolean;
  sendingDate: boolean;
  inverterSerialNumber: boolean;
  registeredBy: boolean;
}

export interface Filters {
  paymentStatus: string;
  sendingDate: string;
  paymentMethod: string;
  serialNumberStatus: string;
  productModel: string;
  teamMember: string;
  search: string;
}

export interface RewardsState {
  // Search and filtering
  filters: Filters;

  // Sorting
  sortField: string;
  sortDirection: "asc" | "desc";

  // Pagination
  currentPage: number;
  itemsPerPage: number;

  // Column visibility
  visibleColumns: ColumnVisibility;

  // Selection
  selectedRewards: Set<string>;

  // Modal state
  editModalOpen: boolean;
  selectedRewardId: string;

  // Delete dialog state
  deleteDialogState: {
    open: boolean;
    status: "confirm" | "deleting" | "success" | "error";
    message?: string;
    rewardId?: string;
    rewardSerialNumber?: string;
  };

  // Bulk delete state
  bulkDeleteResultState: {
    open: boolean;
    successCount: number;
    failCount: number;
    failures: Array<{ name: string; reason: string }>;
  };

  // UI state
  bulkDeleting: boolean;
  deletingId: string | null;
  downloadingReport: boolean;
}

export type RewardsAction =
  | { type: "SET_FILTER"; payload: { key: keyof Filters; value: string } }
  | { type: "SET_FILTERS"; payload: Partial<Filters> }
  | { type: "RESET_FILTERS" }
  | { type: "SET_SORT"; payload: { field: string; direction: "asc" | "desc" } }
  | { type: "TOGGLE_SORT"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ITEMS_PER_PAGE"; payload: number }
  | { type: "TOGGLE_COLUMN"; payload: keyof ColumnVisibility }
  | { type: "SET_COLUMNS"; payload: Partial<ColumnVisibility> }
  | { type: "SELECT_REWARD"; payload: string }
  | { type: "DESELECT_REWARD"; payload: string }
  | { type: "SELECT_ALL_REWARDS"; payload: string[] }
  | { type: "DESELECT_ALL_REWARDS"; payload: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "TOGGLE_REWARD_SELECTION"; payload: string }
  | { type: "OPEN_EDIT_MODAL"; payload: string }
  | { type: "CLOSE_EDIT_MODAL" }
  | { type: "SET_DELETE_DIALOG_STATE"; payload: Partial<RewardsState["deleteDialogState"]> }
  | { type: "RESET_DELETE_DIALOG" }
  | { type: "SET_BULK_DELETE_RESULT_STATE"; payload: Partial<RewardsState["bulkDeleteResultState"]> }
  | { type: "RESET_BULK_DELETE_RESULT" }
  | { type: "SET_BULK_DELETING"; payload: boolean }
  | { type: "SET_DELETING_ID"; payload: string | null }
  | { type: "SET_DOWNLOADING_REPORT"; payload: boolean }
  | { type: "RESET_TO_PAGE_ONE" };

const initialFilters: Filters = {
  paymentStatus: "ALL",
  sendingDate: "",
  paymentMethod: "all",
  serialNumberStatus: "all",
  productModel: "all",
  teamMember: "all",
  search: "",
};

const initialColumnVisibility: ColumnVisibility = {
  serialNumber: true,
  installerCode: false,
  installer: true,
  productModel: true,
  cityOfInstallation: false,
  rewardAmount: true,
  paymentStatus: true,
  paymentMethod: false,
  transactionId: false,
  sendingDate: false,
  inverterSerialNumber: false,
  registeredBy: false,
};

export const initialState: RewardsState = {
  filters: initialFilters,
  sortField: "createdAt",
  sortDirection: "desc",
  currentPage: 1,
  itemsPerPage: 10,
  visibleColumns: initialColumnVisibility,
  selectedRewards: new Set(),
  editModalOpen: false,
  selectedRewardId: "",
  deleteDialogState: {
    open: false,
    status: "confirm",
  },
  bulkDeleteResultState: {
    open: false,
    successCount: 0,
    failCount: 0,
    failures: [],
  },
  bulkDeleting: false,
  deletingId: null,
  downloadingReport: false,
};

function rewardsReducer(
  state: RewardsState,
  action: RewardsAction
): RewardsState {
  switch (action.type) {
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
      } else {
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

    case "SET_ITEMS_PER_PAGE":
      return {
        ...state,
        itemsPerPage: action.payload,
        currentPage: 1,
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

    case "SELECT_REWARD":
      return {
        ...state,
        selectedRewards: new Set([...state.selectedRewards, action.payload]),
      };

    case "DESELECT_REWARD": {
      const newSelection = new Set(state.selectedRewards);
      newSelection.delete(action.payload);
      return {
        ...state,
        selectedRewards: newSelection,
      };
    }

    case "SELECT_ALL_REWARDS":
      return {
        ...state,
        selectedRewards: new Set([...state.selectedRewards, ...action.payload]),
      };

    case "DESELECT_ALL_REWARDS": {
      const newSelection = new Set(state.selectedRewards);
      action.payload.forEach((id) => newSelection.delete(id));
      return {
        ...state,
        selectedRewards: newSelection,
      };
    }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedRewards: new Set(),
      };

    case "TOGGLE_REWARD_SELECTION": {
      const newSelection = new Set(state.selectedRewards);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return {
        ...state,
        selectedRewards: newSelection,
      };
    }

    case "OPEN_EDIT_MODAL":
      return {
        ...state,
        editModalOpen: true,
        selectedRewardId: action.payload,
      };

    case "CLOSE_EDIT_MODAL":
      return {
        ...state,
        editModalOpen: false,
        selectedRewardId: "",
      };

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
          successCount: 0,
          failCount: 0,
          failures: [],
        },
      };

    case "SET_BULK_DELETING":
      return {
        ...state,
        bulkDeleting: action.payload,
      };

    case "SET_DELETING_ID":
      return {
        ...state,
        deletingId: action.payload,
      };

    case "SET_DOWNLOADING_REPORT":
      return {
        ...state,
        downloadingReport: action.payload,
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

export function useRewardsState(): [RewardsState, Dispatch<RewardsAction>] {
  return useReducer(rewardsReducer, initialState);
}
