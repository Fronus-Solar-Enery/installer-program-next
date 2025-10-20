"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Package, Loader2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import IconMagnifer from "./icons/Magnifer";

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

  // Load recent searches
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to parse recent searches:", error);
        }
      }
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

  // Save recent search
  const saveRecentSearch = (
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
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Get all results as flat list
  const getAllResults = useCallback((): Array<{
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
        router.push(`/installers?id=${id}`);
      } else {
        router.push(`/rewards?id=${id}`);
      }
    },
    [searchQuery, onOpenChange, router]
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
      const allResults = getAllResults();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && allResults.length > 0) {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          handleResultClick(selected.type, selected.data._id, selected.data);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, getAllResults, handleResultClick]);

  const allResults = getAllResults();

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
        <div className="flex items-center border-b border-border px-4 py-3 bg-muted/20 rounded-t-3xl">
          <div className="flex items-center w-full">
            <IconMagnifer
              duotone={false}
              className="h-5 w-5 text-muted-foreground mr-3 pointer-events-none"
            />
            <Input
              placeholder="Search by installer code, CNIC, phone, serial number, transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base !bg-transparent h-10 !rounded-none"
              autoFocus
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[500px]">
          <div className="p-2">
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
                <div className="space-y-1">
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
                  {recentSearches.map((recent, index) => (
                    <div
                      key={`${recent.result._id}-${index}`}
                      onClick={() => handleRecentSearchClick(recent)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      {recent.type === "installer" ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Package className="h-4 w-4 text-green-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {"fullName" in recent.result
                              ? recent.result.fullName
                              : recent.result.serialNumber}
                          </span>
                          {(("installerCode" in recent.result &&
                            recent.result.installerCode) ||
                            ("installer" in recent.result &&
                              recent.result.installer?.installerCode)) && (
                            <Badge variant="outline" className="text-xs">
                              {"installerCode" in recent.result
                                ? recent.result.installerCode
                                : recent.result.installer?.installerCode}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(recent.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                      <div>
                        • CNIC • Installer Code • Phone • WhatsApp • Name
                      </div>
                      <div>• Account Number • Account Title • Company Name</div>
                      <div>
                        • Serial Number • Transaction ID • Referrer Transaction
                        ID
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
              <div className="space-y-1">
                {/* Installers */}
                {searchResults.installers.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Installers ({searchResults.installers.length})
                    </div>
                    {searchResults.installers.map(
                      (installer: InstallerResult, idx: number) => {
                        const globalIdx = idx;
                        return (
                          <div
                            key={installer._id}
                            onClick={() =>
                              handleResultClick(
                                "installer",
                                installer._id,
                                installer
                              )
                            }
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                              selectedIndex === globalIdx
                                ? "bg-accent"
                                : "hover:bg-accent"
                            )}
                          >
                            <Users className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium truncate">
                                  {installer.fullName}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {installer.installerCode}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                                {installer.city && (
                                  <span>📍 {installer.city}</span>
                                )}
                                {installer.phoneNumber && (
                                  <span>📞 {installer.phoneNumber}</span>
                                )}
                                {installer.cnic && (
                                  <span>🆔 {installer.cnic}</span>
                                )}
                              </div>
                              {installer.companyName && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  🏢 {installer.companyName}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </>
                )}

                {/* Rewards */}
                {searchResults.rewards.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                      Rewards ({searchResults.rewards.length})
                    </div>
                    {searchResults.rewards.map(
                      (reward: RewardResult, idx: number) => {
                        const globalIdx = searchResults.installers.length + idx;
                        return (
                          <div
                            key={reward._id}
                            onClick={() =>
                              handleResultClick("reward", reward._id, reward)
                            }
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                              selectedIndex === globalIdx
                                ? "bg-accent"
                                : "hover:bg-accent"
                            )}
                          >
                            <Package className="h-5 w-5 text-green-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium font-mono text-sm truncate">
                                  {reward.serialNumber}
                                </span>
                                <Badge
                                  variant={
                                    reward.paymentStatus === "PAID"
                                      ? "default"
                                      : reward.paymentStatus === "PENDING"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {reward.paymentStatus}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                {reward.productModel}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                                <span>💰 Rs. {reward.rewardAmount}</span>
                                {reward.installer?.installerCode && (
                                  <span>
                                    👤 {reward.installer.installerCode}
                                  </span>
                                )}
                                {reward.cityOfInstallation && (
                                  <span>📍 {reward.cityOfInstallation}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between bg-muted/20 rounded-b-3xl">
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
