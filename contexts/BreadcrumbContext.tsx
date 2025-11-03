"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface BreadcrumbItem {
  label: string | React.ReactNode;
  href?: string;
  icon?: React.FC<IconProps>;
}

export interface BreadcrumbOverride {
  label: string | React.ReactNode;
  icon?: React.FC<IconProps>;
}

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
  overrides: Record<string, BreadcrumbOverride>;
  setOverride: (href: string, override: BreadcrumbOverride) => void;
  clearOverride: (href: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const [overrides, setOverrides] = useState<
    Record<string, BreadcrumbOverride>
  >({});

  const handleSetItems = useCallback((newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  }, []);

  const setOverride = useCallback(
    (href: string, override: BreadcrumbOverride) => {
      setOverrides((prev) => ({ ...prev, [href]: override }));
    },
    []
  );

  const clearOverride = useCallback((href: string) => {
    setOverrides((prev) => {
      const copy = { ...prev };
      delete copy[href];
      return copy;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{
        items,
        setItems: handleSetItems,
        overrides,
        setOverride,
        clearOverride,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx)
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  return ctx;
}

// USAGE
/* 
const pathname = usePathname();
const { setOverride, clearOverride } = useBreadcrumb();

useEffect(() => {
  if (!pathname) return;

  const isLoading = !installer?.installerCode || !installer?.fullName;

  setOverride(pathname, {
    label: isLoading
      ? "Loading..."
      : `${installer.installerCode} ${installer.fullName}`,
    icon: IconProfile2user as React.FC<IconProps>,
  });

  return () => {
    clearOverride(pathname);
  };
}, [pathname, installer, setOverride, clearOverride]);
*/
