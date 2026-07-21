import { useReducer, Dispatch } from "react";
import {
  BaseEntityListState,
  BaseEntityListAction,
  BaseDateFilters,
  EntityListConfig,
  createEntityListReducer,
  createInitialState,
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
  productStatus: boolean;
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
  productStatus: string;
  // Reward sending date, filtered as an inclusive range. This replaced a single
  // `sendingDate` string that compared an ISO datetime against a date and so
  // never matched anything.
  sendingStart: string;
  sendingEnd: string;
  paymentMethod: string;
  installationDate: string;
  productModel: string;
  teamMember: string;
  search: string;
  updatedAt: string;
}

// Initial values
const initialFilters: RewardsFilters = {
  rewardStatus: "ALL",
  productStatus: "all",
  sendingStart: "",
  sendingEnd: "",
  paymentMethod: "all",
  installationDate: "",
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
  productStatus: true,
  paymentMethod: false,
  transactionId: false,
  sendingDate: false,
  inverterSerialNumber: false,
  registeredBy: false,
  referrerName: false,
  referrerTransactionId: false,
  referrerReward: false,
};

// Configuration for rewards entity list
const rewardsConfig: EntityListConfig<RewardsFilters, RewardsColumnVisibility> =
  {
    initialFilters,
    initialColumns: initialColumnVisibility,
    defaultSortField: "createdAt",
    defaultSortDirection: "desc",
    defaultItemsPerPage: 10,
    // Custom sort behavior for rewards
    customSortBehavior: (state, field) => {
      if (state.sortField === field) {
        if (field === "createdAt") {
          // For date fields: only toggle between asc and desc (no reset)
          return {
            sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
          };
        } else {
          // For other fields: cycle through asc -> desc -> reset to default
          if (state.sortDirection === "asc") {
            return { sortDirection: "desc" };
          } else {
            // Reset to default sort (createdAt desc)
            return { sortField: "createdAt", sortDirection: "desc" };
          }
        }
      }
      return null; // Use default behavior
    },
    // Custom reset behavior to handle updatedAt sort field
    onResetFilters: (state) => {
      if (state.sortField === "updatedAt") {
        return { sortField: "createdAt", sortDirection: "desc" };
      }
      return {};
    },
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

// Rewards-specific action types (not in base)
type RewardsSpecificAction =
  // Legacy action aliases for backwards compatibility
  | { type: "SELECT_REWARD"; payload: string }
  | { type: "DESELECT_REWARD"; payload: string }
  | { type: "SELECT_ALL_REWARDS"; payload: string[] }
  | { type: "DESELECT_ALL_REWARDS"; payload: string[] }
  | { type: "TOGGLE_REWARD_SELECTION"; payload: string }
  // Rewards-specific actions
  | { type: "SET_BULK_DELETING"; payload: boolean };

// Extended action type combining base and rewards-specific actions
export type RewardsAction =
  | BaseEntityListAction<RewardsFilters, RewardsColumnVisibility>
  | RewardsSpecificAction;

// Initial rewards-specific state additions
const rewardsSpecificInitialState = {
  bulkDeleting: false,
  selectedRewards: new Set<string>(),
  selectedRewardId: "",
};

// Create initial state by combining base state with rewards-specific state
export const initialState: RewardsState = {
  ...createInitialState(rewardsConfig),
  ...rewardsSpecificInitialState,
};

// Get the base reducer
const baseReducer = createEntityListReducer(rewardsConfig);

/**
 * Reducer that composes base entity list reducer with rewards-specific actions.
 * This eliminates duplication by delegating common actions to the base reducer.
 */
function rewardsReducer(
  state: RewardsState,
  action: RewardsAction
): RewardsState {
  // Handle rewards-specific actions first
  switch (action.type) {
    // Rewards-specific actions
    case "SET_BULK_DELETING":
      return { ...state, bulkDeleting: action.payload };

    // Legacy action aliases (map to base actions for backwards compatibility)
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

    // Delegate all other actions to the base reducer
    default: {
      // Cast to base action type for the base reducer
      const baseAction = action as BaseEntityListAction<
        RewardsFilters,
        RewardsColumnVisibility
      >;
      const baseResult = baseReducer(state, baseAction);
      // Preserve rewards-specific state when base reducer handles the action
      return {
        ...baseResult,
        bulkDeleting: state.bulkDeleting,
        selectedRewards: baseResult.selectedItems,
        selectedRewardId: baseResult.selectedItemId,
      };
    }
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
