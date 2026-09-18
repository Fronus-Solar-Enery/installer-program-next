import { IInstaller } from "@/models/Installer";
import { IInstallerReward } from "@/models/InstallerReward";
import { IProduct } from "@/models/Product";
import { ITeamMember } from "@/models/TeamMember";
import { getBankLabel } from "@/lib/constants";

/**
 * Row building for the Complete Installers report: one row per submitted
 * product, with the installer's full profile repeated on each of their rows.
 * Installers with no submissions still get one row, product cells blank.
 *
 * Pure — the route does the querying, this does the shaping.
 */

export type ReportInstaller = Omit<IInstaller, "referrer" | "registeredBy"> & {
  _id: unknown;
  createdAt?: Date;
  registeredBy?: Pick<ITeamMember, "name" | "email"> | unknown;
  referrer?: Pick<IInstaller, "installerCode" | "fullName"> | unknown;
};

export type ReportReward = Omit<
  IInstallerReward,
  "installer" | "referrer" | "registeredBy"
> & {
  installer: unknown;
  createdAt?: Date;
  registeredBy?: Pick<ITeamMember, "name" | "email"> | unknown;
};

export type ReportCell = string | number;

const NA = "N/A";

export const COMPLETE_INSTALLER_COLUMNS = [
  // Installer profile — repeated on every row of that installer
  { header: "Installer Code", width: 16 },
  { header: "Full Name", width: 24 },
  { header: "CNIC", width: 18 },
  { header: "Phone Number", width: 16 },
  { header: "WhatsApp Number", width: 16 },
  { header: "Address", width: 34 },
  { header: "City", width: 16 },
  { header: "District", width: 16 },
  { header: "Province", width: 16 },
  { header: "Company Name", width: 24 },
  { header: "Bank Name", width: 26 },
  { header: "Account Number", width: 24 },
  { header: "Account Title", width: 24 },
  { header: "Certified", width: 10 },
  { header: "Referrer Code", width: 16 },
  { header: "Referrer Name", width: 24 },
  { header: "Registered By", width: 20 },
  { header: "Registration Date", width: 16 },
  { header: "Products Submitted", width: 18 },
  { header: "Total Reward Earned", width: 18 },
  // Submitted product
  { header: "Serial Number", width: 22 },
  { header: "Inverter Serial Number", width: 22 },
  { header: "Product Model", width: 34 },
  { header: "City of Installation", width: 20 },
  { header: "Installation Date", width: 16 },
  { header: "Submission Date", width: 16 },
  // Product profile (from the Product catalogue)
  { header: "Product Reward Value", width: 18 },
  { header: "Requires Inverter", width: 16 },
  { header: "Battery Product", width: 16 },
  { header: "Product Active", width: 14 },
  // Payment
  { header: "Reward Amount", width: 16 },
  { header: "Reward Status", width: 14 },
  { header: "Transaction ID", width: 22 },
  { header: "Payment Method", width: 18 },
  { header: "Payment Bank", width: 26 },
  { header: "Payment Account Number", width: 24 },
  { header: "Payment Account Title", width: 24 },
  { header: "Sending Date", width: 16 },
  { header: "Referrer Reward Amount", width: 20 },
  { header: "Referrer Transaction ID", width: 22 },
  { header: "Submitted By", width: 20 },
] as const;

const PROFILE_COLUMN_COUNT = 20;

const formatDate = (value?: Date | string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : NA;

const nameOf = (ref: unknown) =>
  (ref as { name?: string } | undefined)?.name || NA;

const fullNameOf = (ref: unknown) =>
  (ref as { fullName?: string } | undefined)?.fullName || NA;

export function buildCompleteInstallerRows(
  installers: ReportInstaller[],
  rewards: ReportReward[],
  products: Pick<
    IProduct,
    "name" | "reward" | "requiresInverter" | "isBattery" | "active"
  >[]
): ReportCell[][] {
  const productByName = new Map(products.map((p) => [p.name, p]));

  // installer id -> its submissions, in the order given (newest first)
  const rewardsByInstaller = new Map<string, ReportReward[]>();
  for (const reward of rewards) {
    const key = String(reward.installer);
    const list = rewardsByInstaller.get(key);
    if (list) list.push(reward);
    else rewardsByInstaller.set(key, [reward]);
  }

  return installers.flatMap((installer) => {
    const submissions = rewardsByInstaller.get(String(installer._id)) ?? [];
    const totalEarned = submissions.reduce(
      (sum, r) => sum + (r.rewardAmount || 0),
      0
    );

    const profile: ReportCell[] = [
      installer.installerCode,
      installer.fullName,
      installer.cnic,
      installer.phoneNumber,
      installer.whatsappNumber,
      installer.address,
      installer.city,
      installer.district,
      installer.province,
      installer.companyName || "",
      getBankLabel(installer.bankName),
      installer.accountNumber,
      installer.accountTitle,
      installer.certified ? "Yes" : "No",
      installer.referrerCode || NA,
      fullNameOf(installer.referrer),
      nameOf(installer.registeredBy),
      formatDate(installer.createdAt),
      submissions.length,
      totalEarned,
    ];

    if (submissions.length === 0) {
      const blanks: ReportCell[] = Array(
        COMPLETE_INSTALLER_COLUMNS.length - PROFILE_COLUMN_COUNT
      ).fill("");
      return [[...profile, ...blanks]];
    }

    return submissions.map((reward) => {
      const product = productByName.get(reward.productModel);
      return [
        ...profile,
        reward.serialNumber,
        reward.inverterSerialNumber || NA,
        reward.productModel,
        reward.cityOfInstallation,
        formatDate(reward.installationDate),
        formatDate(reward.createdAt),
        product ? product.reward : NA,
        product ? (product.requiresInverter ? "Yes" : "No") : NA,
        product ? (product.isBattery ? "Yes" : "No") : NA,
        product ? (product.active ? "Yes" : "No") : NA,
        reward.rewardAmount,
        reward.rewardStatus,
        reward.transactionId || NA,
        reward.paymentMethod || NA,
        getBankLabel(reward.bankName),
        reward.accountNumber,
        reward.accountTitle,
        formatDate(reward.sendingDate),
        reward.referrerRewardAmount || 0,
        reward.referrerTransactionId || NA,
        nameOf(reward.registeredBy),
      ];
    });
  });
}
