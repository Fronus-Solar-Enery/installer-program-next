"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Package, Loader2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import IconMagnifer from "./icons/Magnifer";
import { Card } from "./ui/card";
import { InstallerAvatar } from "./UserAvatar";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import {
  IconCheck,
  IconCopy,
  IconGift,
  IconMapPoint,
  IconProduct,
  IconSmartphone2,
  IconUser,
  IconUserId,
} from "./icons";

interface InstallerResult {
  _id: string;
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  city: string;
  accountNumber?: string;
  accountTitle?: string;
  companyName?: string;
}

interface RewardResult {
  _id: string;
  serialNumber: string;
  productModel: string;
  rewardAmount: number;
  paymentStatus: string;
  transactionId?: string;
  referrerTransactionId?: string;
  cityOfInstallation: string;
  createdAt?: string;
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    cnic: string;
    phoneNumber: string;
    whatsappNumber: string;
    city: string;
  };
}

interface SearchResult {
  installers: InstallerResult[];
  rewards: RewardResult[];
  query: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  type: "installer" | "reward";
  result: InstallerResult | RewardResult;
}

const RECENT_SEARCHES_KEY = "global_search_recent";
const MAX_RECENT_SEARCHES = 5;

// Helper function to truncate text to max 2 words and 15 characters
const truncateText = (text: string): string => {
  const words = text.trim().split(/\s+/);
  const firstTwoWords = words.slice(0, 2).join(" ");

  if (firstTwoWords.length > 15) {
    return firstTwoWords.slice(0, 15) + "...";
  }

  return firstTwoWords;
};

// Helper function to format date with time
const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearchModal({
  open,
  onOpenChange,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { copyToClipboard, copied } = useClipboard();

  // Load recent searches - optimized
  useEffect(() => {
    if (!open) return;

    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setRecentSearches(parsed);
    } catch (error) {
      console.error("Failed to parse recent searches:", error);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, [open]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ installers: [], rewards: [], query });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Save recent search - optimized with useCallback
  const saveRecentSearch = useCallback(
    (
      type: "installer" | "reward",
      result: InstallerResult | RewardResult,
      query: string
    ) => {
      const newSearch: RecentSearch = {
        query,
        timestamp: Date.now(),
        type,
        result,
      };

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.result._id !== result._id);
        const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // Clear recent searches - optimized with useCallback
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Get all results as flat list - optimized with useMemo
  const allResults = useMemo((): Array<{
    type: "installer" | "reward";
    data: InstallerResult | RewardResult;
  }> => {
    if (!searchResults) return [];
    const results: Array<{
      type: "installer" | "reward";
      data: InstallerResult | RewardResult;
    }> = [];

    searchResults.installers.forEach((installer) => {
      results.push({ type: "installer" as const, data: installer });
    });

    searchResults.rewards.forEach((reward) => {
      results.push({ type: "reward" as const, data: reward });
    });

    return results;
  }, [searchResults]);

  // Handle result click
  const handleResultClick = useCallback(
    (
      type: "installer" | "reward",
      id: string,
      result?: InstallerResult | RewardResult
    ) => {
      if (result) {
        saveRecentSearch(type, result, searchQuery);
      }
      onOpenChange(false);
      if (type === "installer") {
        router.push(`/installers/${id}`);
      } else {
        router.push(`/rewards?id=${id}`);
      }
    },
    [searchQuery, onOpenChange, router, saveRecentSearch]
  );

  // Handle recent search click
  const handleRecentSearchClick = useCallback(
    (recent: RecentSearch) => {
      handleResultClick(recent.type, recent.result._id, recent.result);
    },
    [handleResultClick]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Determine if we're navigating search results or recent searches
      const isSearchActive = searchQuery.length >= 2 && allResults.length > 0;
      const isRecentSearchesActive =
        searchQuery.length < 2 && recentSearches.length > 0;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isSearchActive) {
          setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        } else if (isRecentSearchesActive) {
          setSelectedIndex((prev) =>
            Math.min(prev + 1, recentSearches.length - 1)
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isSearchActive) {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (isRecentSearchesActive) {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isSearchActive) {
          const selected = allResults[selectedIndex];
          if (selected) {
            handleResultClick(selected.type, selected.data._id, selected.data);
          }
        } else if (isRecentSearchesActive) {
          const selected = recentSearches[selectedIndex];
          if (selected) {
            handleRecentSearchClick(selected);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    selectedIndex,
    allResults,
    recentSearches,
    searchQuery,
    handleResultClick,
    handleRecentSearchClick,
  ]);

  // Stable click handler factory to avoid inline recreation in map
  const handleCopy = useCallback(
    (code: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      copyToClipboard(code);
    },
    [copyToClipboard]
  );

  // Optimized search query change handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Optimized clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Memoize rendered recent searches to avoid re-renders
  const renderedRecentSearches = useMemo(() => {
    return recentSearches.map((recent, index) => {
      const displayText =
        "fullName" in recent.result
          ? truncateText(recent.result.fullName)
          : truncateText(recent.result.productModel);

      const installerCode =
        "installerCode" in recent.result
          ? recent.result.installerCode
          : recent.result.installer?.installerCode;

      return (
        <Card
          key={`${recent.result._id}-${index}`}
          onClick={() => handleRecentSearchClick(recent)}
          className={cn(
            "transition-colors flex items-center justify-between p-4 cursor-pointer bg-transparent dark:bg-card",
            selectedIndex === index && searchQuery.length < 2
              ? "bg-card dark:bg-accent/70"
              : "hover:bg-card dark:hover:bg-accent/70"
          )}
        >
          <div className="flex items-center gap-4">
            <InstallerAvatar
              user={
                "fullName" in recent.result ? (
                  <IconUser fill />
                ) : (
                  <IconProduct fill />
                )
              }
              className={cn(
                "size-8 shadow-md font-black font-sans p-6",
                "border-border bg-muted"
              )}
            />

            <div
              className={cn(
                "text-md font-semibold leading-none",
                "text-foreground"
              )}
            >
              <h2 className="truncate">{displayText}</h2>
              {installerCode && (
                <div
                  className={cn(
                    "text-xs text-muted-foreground/70 font-light font-mono leading-none flex items-center"
                  )}
                >
                  {installerCode}
                  <div
                    onClick={handleCopy(installerCode)}
                    className="!p-1 !size-max rounded-sm hover:text-muted-foreground transition-colors"
                  >
                    {copied === installerCode ? (
                      <IconCheck className="text-green-500" />
                    ) : (
                      <IconCopy />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">
                {formatDateTime(recent.timestamp)}
              </span>
            </div>
          </div>
        </Card>
      );
    });
  }, [
    recentSearches,
    handleRecentSearchClick,
    handleCopy,
    copied,
    selectedIndex,
    searchQuery.length,
  ]);

  // Memoize installer results rendering
  const renderedInstallerResults = useMemo(() => {
    if (!searchResults?.installers.length) return null;

    return searchResults.installers.map(
      (installer: InstallerResult, idx: number) => {
        const globalIdx = idx;
        return (
          <Card
            key={installer._id}
            onClick={() =>
              handleResultClick("installer", installer.installerCode, installer)
            }
            className={cn(
              "transition-colors flex items-center justify-between p-4 cursor-pointer bg-transparent dark:bg-card",
              selectedIndex === globalIdx
                ? "bg-card dark:bg-accent/70"
                : "hover:bg-card dark:hover:bg-accent/70"
            )}
          >
            <div className="flex items-center gap-4">
              <InstallerAvatar
                user={installer.fullName}
                className={cn(
                  "size-8 shadow-md font-black font-sans p-6",
                  "border-border bg-muted"
                )}
              />

              <div className="space-y-2">
                <h2 className="truncate flex items-start gap-2 text-md font-semibold leading-none text-foreground">
                  {installer.fullName}
                  {installer.installerCode && (
                    <div
                      className={cn(
                        "text-xs text-muted-foreground/70 font-light font-mono leading-none flex items-center"
                      )}
                    >
                      {installer.installerCode}
                      <div
                        onClick={handleCopy(installer.installerCode)}
                        className="!p-1 !size-max rounded-sm hover:text-muted-foreground transition-colors"
                      >
                        {copied === installer.installerCode ? (
                          <IconCheck className="text-green-500" />
                        ) : (
                          <IconCopy />
                        )}
                      </div>
                    </div>
                  )}
                </h2>
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  {installer.cnic && (
                    <span className="flex items-center gap-1 leading-none">
                      <IconUserId className="size-3.5" />
                      {installer.cnic}
                    </span>
                  )}

                  {installer.phoneNumber && (
                    <span className="flex items-center gap-1 leading-none">
                      <IconSmartphone2 className="size-3.5" />
                      {installer.phoneNumber}
                    </span>
                  )}
                  {installer.city && (
                    <span className="flex items-center gap-1 leading-none">
                      <IconMapPoint className="size-3.5" />
                      {installer.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      }
    );
  }, [
    searchResults?.installers,
    selectedIndex,
    handleResultClick,
    copied,
    handleCopy,
  ]);

  // Memoize reward results rendering
  const renderedRewardResults = useMemo(() => {
    if (!searchResults?.rewards.length) return null;

    const installersLength = searchResults.installers?.length || 0;

    return searchResults.rewards.map((reward: RewardResult, idx: number) => {
      const globalIdx = installersLength + idx;
      return (
        <Card
          key={reward._id}
          onClick={() => handleResultClick("reward", reward._id, reward)}
          className={cn(
            "transition-colors flex items-center justify-between p-4 cursor-pointer bg-primary-foreground dark:bg-card",
            selectedIndex === globalIdx
              ? "bg-card dark:bg-accent/70"
              : "hover:bg-card dark:hover:bg-accent/70"
          )}
        >
          <div className="flex items-center gap-4">
            <InstallerAvatar
              user={
                <>
                  <IconProduct fill />{" "}
                </>
              }
              className={cn(
                "size-8 shadow-md font-black font-sans p-6",
                "border-border bg-muted"
              )}
            />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <h2 className="truncate  text-md font-semibold leading-none text-foreground">
                  {reward.productModel}
                </h2>
                {reward.serialNumber && (
                  <div
                    className={cn(
                      "text-xs text-muted-foreground/70 font-light font-mono leading-none flex items-center"
                    )}
                  >
                    {reward.serialNumber}
                    <div
                      onClick={handleCopy(reward.serialNumber)}
                      className="!p-1 !size-max rounded-sm hover:text-muted-foreground transition-colors"
                    >
                      {copied === reward.serialNumber ? (
                        <IconCheck className="text-green-500" />
                      ) : (
                        <IconCopy />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                {reward.installer?.fullName && (
                  <span className="flex items-center gap-1 leading-none">
                    <IconUser className="size-3.5" />
                    {reward.installer?.fullName}
                  </span>
                )}

                {reward.cityOfInstallation && (
                  <span className="flex items-center gap-1 leading-none">
                    <IconMapPoint className="size-3.5" />
                    {reward.cityOfInstallation}
                  </span>
                )}

                {reward.rewardAmount && (
                  <span className="flex items-center gap-1 leading-none">
                    <IconGift className="size-3.5" />
                    {reward.rewardAmount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Badge
            variant={
              reward.paymentStatus === "PAID"
                ? "default"
                : reward.paymentStatus === "PENDING"
                ? "warning"
                : "destructive"
            }
            className="text-[10px] tracking-widest font-semibold"
          >
            {reward.paymentStatus}
          </Badge>
        </Card>
      );
    });
  }, [
    searchResults?.rewards,
    searchResults?.installers?.length,
    selectedIndex,
    handleResultClick,
    copied,
    handleCopy,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search for installers by CNIC, code, phone, name, or rewards by
            serial number and transaction ID
          </DialogDescription>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4 py-3 bg-card dark:bg-muted/40 backdrop-blur-2xl rounded-t-3xl">
          <div className="flex items-center w-full">
            <IconMagnifer className="h-5 w-5 text-muted-foreground mr-3 pointer-events-none" />
            <Input
              placeholder="Search by installer code, CNIC, phone, serial number, transaction ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base !bg-transparent h-10 !rounded-none placeholder:!text-sm"
              autoFocus
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="overflow-hidden">
          {/* Loading */}
          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Recent Searches */}
          {!isSearching &&
            searchQuery.length < 2 &&
            recentSearches.length > 0 && (
              <div className="w-full">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Recent Searches</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>

                <ScrollArea className="h-96 whitespace-nowrap">
                  <div className="space-y-2 pl-2 pr-3 pb-2 ">
                    {renderedRecentSearches}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            )}

          {/* Search Help */}
          {!isSearching &&
            searchQuery.length < 2 &&
            recentSearches.length === 0 && (
              <div className="py-12 px-4 text-center text-sm text-muted-foreground space-y-3">
                <div className="font-medium">Start typing to search</div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-foreground">
                    Searchable Fields:
                  </div>
                  <div className="space-y-1">
                    <div>• CNIC • Installer Code • Phone • WhatsApp • Name</div>
                    <div>• Account Number • Account Title • Company Name</div>
                    <div>
                      • Serial Number • Transaction ID • Referrer Transaction ID
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* No Results */}
          {!isSearching &&
            searchQuery.length >= 2 &&
            searchResults &&
            allResults.length === 0 && (
              <div className="py-12 px-4 text-center">
                <div className="text-muted-foreground mb-2">
                  No results found for &quot;{searchQuery}&quot;
                </div>
                <div className="text-xs text-muted-foreground">
                  Try searching with different keywords
                </div>
              </div>
            )}

          {/* Results List */}
          {!isSearching && searchQuery.length >= 2 && searchResults && (
            <div className="space-y-1 p-1">
              {/* Installers */}
              {renderedInstallerResults && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Installers ({searchResults.installers.length})
                  </div>
                  {renderedInstallerResults}
                </>
              )}

              {/* Rewards */}
              {renderedRewardResults && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                    Rewards ({searchResults.rewards.length})
                  </div>
                  {renderedRewardResults}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between bg-card dark:bg-muted/20 rounded-b-3xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono leading-none">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono leading-none">
                Enter
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono leading-none">
                Esc
              </kbd>
              <span>Close</span>
            </div>
          </div>
          <div>
            {allResults.length > 0 &&
              `${allResults.length} result${
                allResults.length !== 1 ? "s" : ""
              }`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
