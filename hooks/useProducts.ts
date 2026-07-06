import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// value/label kept alongside name so existing PRODUCT_MODELS-shaped consumers
// (dropdowns doing `.find(p => p.value === x)`) don't need to change.
export interface ProductWithId {
  _id: string;
  name: string;
  value: string;
  label: string;
  reward: number;
  requiresInverter: boolean;
  isBattery: boolean;
  active: boolean;
  order: number;
}

export interface ProductInput {
  name: string;
  reward: number;
  requiresInverter: boolean;
  isBattery: boolean;
  active?: boolean;
}

function toProductWithId(raw: {
  _id: string;
  name: string;
  reward: number;
  requiresInverter: boolean;
  isBattery: boolean;
  active: boolean;
  order: number;
}): ProductWithId {
  return { ...raw, value: raw.name, label: raw.name };
}

export function useProducts(includeInactive = false) {
  return useQuery({
    queryKey: ["products", { includeInactive }],
    queryFn: async () => {
      const response = await fetch(
        `/api/products${includeInactive ? "?includeInactive=true" : ""}`
      );
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch products");
      return (data.data as Parameters<typeof toProductWithId>[0][]).map(
        toProductWithId
      );
    },
    staleTime: 60000,
    gcTime: 300000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to create product");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ProductInput>;
    }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to update product");
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to delete product");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
