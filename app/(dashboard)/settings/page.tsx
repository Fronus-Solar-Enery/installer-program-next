"use client";

import { useEffect, useState } from "react";
import { EditSettingDialog } from "./edit-setting-dialog";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminGuard } from "@/hooks/useRoleGuard";
import PageHeader from "@/components/PageHeader";
import {
  IconEdit2,
  IconProduct,
  IconAdd,
  IconTrashBin2,
  IconSave,
  IconSettings,
} from "@/components/icons";
import IconReset from "@/components/icons/Reset";
import { DashboardCardHeader } from "../dashboard/page";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type ProductWithId,
  type ProductInput,
} from "@/hooks/useProducts";
import { ProductFormDialog } from "./product-form-dialog";
import {
  DeleteConfirmationDialog,
  type DeleteDialogState,
} from "@/components/DeleteConfirmationDialog";
import { SETTINGS_CARDS } from "./settings-config";
import { SwitchRow, ValueRow } from "./setting-row";
import { PaymentMethodsCard } from "./payment-methods-card";
import { PAYMENT_METHOD } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";

export interface SettingsData {
  allowInstallerCodeEdit?: boolean;
  maxReferralsPerInstaller?: number;
  defaultReferralReward?: number;
  requireTransactionIdForPaid?: boolean;
  autoSendWhatsAppOnPaid?: boolean;
  enableWhatsAppNotifications?: boolean;
  paymentMethods?: string[];
  updatedAt?: string;
}

// List of switch (boolean) settings keys
const SWITCH_SETTINGS_KEYS: (keyof SettingsData)[] = [
  "allowInstallerCodeEdit",
  "requireTransactionIdForPaid",
  "autoSendWhatsAppOnPaid",
  "enableWhatsAppNotifications",
];

// Default settings values
const DEFAULT_SETTINGS: SettingsData = {
  allowInstallerCodeEdit: false,
  maxReferralsPerInstaller: 5,
  defaultReferralReward: 1000,
  requireTransactionIdForPaid: true,
  autoSendWhatsAppOnPaid: false,
  enableWhatsAppNotifications: false,
  paymentMethods: PAYMENT_METHOD.map((m) => m.value),
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(
    null,
  );
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    key: keyof SettingsData | null;
    title: string;
    description?: string;
    type: "text" | "number" | "email" | "textarea";
  }>({
    isOpen: false,
    key: null,
    title: "",
    description: "",
    type: "text",
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [paymentMethodsSaving, setPaymentMethodsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSavePaymentMethods = async (next: string[]) => {
    // Save against originalSettings so pending switch toggles aren't committed.
    const payload = { ...originalSettings, paymentMethods: next };
    try {
      setPaymentMethodsSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Payment methods updated");
        setSettings((prev) =>
          prev ? { ...prev, paymentMethods: next } : prev,
        );
        setOriginalSettings(payload);
        // Keep TanStack-cached settings (reward dialogs) in sync.
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      } else {
        toast.error(data.error || "Failed to update payment methods");
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setPaymentMethodsSaving(false);
    }
  };

  // Products (admin-editable, backed by the Product collection)
  const { data: products = [], isLoading: productsLoading } = useProducts(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [productDialog, setProductDialog] = useState<{
    isOpen: boolean;
    product: ProductWithId | null;
  }>({ isOpen: false, product: null });
  const [deleteDialogState, setDeleteDialogState] = useState<
    DeleteDialogState & { productId?: string; productName?: string }
  >({ open: false, status: "confirm" });

  const handleProductSave = async (input: ProductInput) => {
    try {
      if (productDialog.product) {
        await updateProduct.mutateAsync({
          id: productDialog.product._id,
          input,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(input);
        toast.success("Product created successfully");
      }
      setProductDialog({ isOpen: false, product: null });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save product",
      );
    }
  };

  const openDeleteDialog = (product: ProductWithId) => {
    setDeleteDialogState({
      open: true,
      status: "confirm",
      productId: product._id,
      productName: product.name,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialogState({ open: false, status: "confirm" });
  };

  const handleProductDelete = async () => {
    const { productId, productName } = deleteDialogState;
    if (!productId) return;

    setDeleteDialogState((prev) => ({ ...prev, status: "deleting" }));

    try {
      await deleteProduct.mutateAsync(productId);
      setDeleteDialogState({
        open: true,
        status: "success",
        message: `Product "${productName}" has been deleted successfully!`,
        productName,
      });
    } catch (error) {
      setDeleteDialogState({
        open: true,
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete product",
        productName,
      });
    }
  };

  // Only check switch settings for hasChanges
  const hasChanges = SWITCH_SETTINGS_KEYS.some(
    (key) => settings?.[key] !== originalSettings?.[key],
  );

  const { isAuthorized } = useAdminGuard({
    autoRedirect: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setOriginalSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchSettings();
    }
  }, [isAuthorized]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings saved successfully");
        setOriginalSettings(settings);
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    key: keyof SettingsData,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const openEditDialog = (
    key: keyof SettingsData,
    title: string,
    description: string,
    type: "text" | "number" | "email" | "textarea" = "text",
  ) => {
    setDialogConfig({
      isOpen: true,
      key,
      title,
      description,
      type,
    });
  };

  const handleDialogSave = async (value: string | number) => {
    if (!dialogConfig.key || !settings || !originalSettings) return;

    const key = dialogConfig.key;
    // Use originalSettings to ensure we don't save pending switch changes
    const payload = { ...originalSettings, [key]: value };

    try {
      setDialogSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${dialogConfig.title} updated successfully`);
        // Update both settings (UI) and originalSettings (Server state)
        // We use function update for settings to preserve any other pending changes (like switches)
        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
        setOriginalSettings(payload);
        // Close the dialog after successful save
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
      } else {
        toast.error(data.error || "Failed to save setting");
      }
    } catch (error) {
      console.error("Failed to save setting:", error);
      toast.error("An error occurred while saving");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setResetting(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings reset to defaults successfully");
        setSettings(DEFAULT_SETTINGS);
        setOriginalSettings(DEFAULT_SETTINGS);
        setShowResetConfirm(false);
      } else {
        toast.error(data.error || "Failed to reset settings");
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("An error occurred while resetting");
    } finally {
      setResetting(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
        iconFill
        Icon={IconSettings}
        action={
          <Button
            onClick={() => setShowResetConfirm(true)}
            variant="outline"
            className="gap-1"
          >
            <IconReset className="size-3.5!" />
            Reset Defaults
          </Button>
        }
      />
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <div className="flex flex-row items-center gap-4 p-6 pb-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <CardContent className="space-y-6 pt-6">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between space-x-2"
                    >
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SETTINGS_CARDS.map((card) => (
              <Card key={card.id}>
                <DashboardCardHeader
                  title={card.title}
                  description={card.description}
                  Icon={card.Icon}
                  iconBadge={false}
                />
                <CardContent className="p-4! space-y-2">
                  {card.rows.map((row) =>
                    row.kind === "switch" ? (
                      <SwitchRow
                        key={row.key}
                        id={row.key}
                        label={row.label}
                        description={row.description}
                        checked={Boolean(settings?.[row.key])}
                        onCheckedChange={(checked) =>
                          updateSetting(row.key, checked)
                        }
                      />
                    ) : (
                      <ValueRow
                        key={row.key}
                        label={row.label}
                        value={row.format(settings)}
                        onEdit={() =>
                          openEditDialog(
                            row.key,
                            row.dialogTitle,
                            row.dialogDescription,
                            row.type,
                          )
                        }
                      />
                    ),
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Payment Methods */}
            <PaymentMethodsCard
              methods={
                settings?.paymentMethods?.length
                  ? settings.paymentMethods
                  : DEFAULT_SETTINGS.paymentMethods!
              }
              saving={paymentMethodsSaving}
              onSave={handleSavePaymentMethods}
            />

            {/* Products & Reward Amounts */}
            <Card className="lg:col-span-2">
              <DashboardCardHeader
                title="Products & Reward Amounts"
                description="Manage the product list and each product's installer reward"
                Icon={IconProduct}
                iconBadge={false}
                actions={
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() =>
                      setProductDialog({ isOpen: true, product: null })
                    }
                  >
                    <IconAdd className="size-3.5!" />
                    Add Product
                  </Button>
                }
              />
              <CardContent className="space-y-4 p-4">
                {productsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No products yet. Add one to get started.
                  </p>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between gap-4 squircle rounded-2xl border border-border pl-4 p-3 transition-colors duration-150 ease-fluid hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <Badge variant="dark">Rs. {product.reward}</Badge>
                            {product.isBattery && (
                              <Badge variant="secondary">Battery</Badge>
                            )}
                            {product.requiresInverter && (
                              <Badge variant="secondary">
                                Requires Inverter Serial
                              </Badge>
                            )}
                            {!product.active && (
                              <Badge variant="warning">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={product.active}
                            aria-label={`${product.active ? "Deactivate" : "Activate"} ${product.name}`}
                            onCheckedChange={(checked) =>
                              updateProduct.mutate({
                                id: product._id,
                                input: { active: checked },
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Edit ${product.name}`}
                            onClick={() =>
                              setProductDialog({ isOpen: true, product })
                            }
                          >
                            <IconEdit2 aria-hidden />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => openDeleteDialog(product)}
                          >
                            <IconTrashBin2 aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Last Updated Info */}
          {settings?.updatedAt && (
            <Alert className="mt-6 squircle rounded-2xl py-6">
              <AlertDescription>
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
          {hasChanges && (
            <AnimatePresence>
              <div className="w-xl fixed left-1/2 bottom-8 -translate-x-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-background/70 border border-border backdrop-blur-xl p-6 squircle rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <p className="text-center text-sm text-muted-foreground">
                    Careful — you have unsaved changes
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setSettings(originalSettings)}
                    >
                      Discard
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="gap-2"
                    >
                      <IconSave width={2} />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>
          )}
          {settings && (
            <EditSettingDialog
              isOpen={dialogConfig.isOpen}
              onClose={() =>
                setDialogConfig((prev) => ({ ...prev, isOpen: false }))
              }
              onSave={handleDialogSave}
              title={dialogConfig.title}
              description={dialogConfig.description}
              currentValue={
                dialogConfig.key
                  ? (settings[dialogConfig.key] as string | number)
                  : ""
              }
              type={dialogConfig.type}
              isSaving={dialogSaving}
            />
          )}
        </>
      )}

      <ProductFormDialog
        isOpen={productDialog.isOpen}
        onClose={() => setProductDialog({ isOpen: false, product: null })}
        onSave={handleProductSave}
        product={productDialog.product}
        isSaving={createProduct.isPending || updateProduct.isPending}
      />

      <DeleteConfirmationDialog
        open={deleteDialogState.open}
        status={deleteDialogState.status}
        itemName={deleteDialogState.productName}
        message={deleteDialogState.message}
        entityType="product"
        warningMessage="If any rewards reference this product, deletion will be refused — deactivate it instead."
        onConfirm={handleProductDelete}
        onClose={closeDeleteDialog}
      />

      {/* Reset to Defaults Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to their default values. This action
              cannot be undone and will overwrite all your current settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetToDefaults}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? "Resetting..." : "Reset to Defaults"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
