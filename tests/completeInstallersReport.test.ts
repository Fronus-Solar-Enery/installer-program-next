import { describe, it, expect } from "vitest";
import {
  COMPLETE_INSTALLER_COLUMNS,
  buildCompleteInstallerRows,
  type ReportInstaller,
  type ReportReward,
} from "@/lib/completeInstallersReport";

const CODE_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Installer Code"
);
const COUNT_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Products Submitted"
);
const TOTAL_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Total Reward Earned"
);
const SERIAL_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Serial Number"
);
const PRODUCT_REWARD_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Product Reward Value"
);
const BATTERY_COL = COMPLETE_INSTALLER_COLUMNS.findIndex(
  (c) => c.header === "Battery Product"
);

const installer = (
  id: string,
  installerCode: string
): ReportInstaller =>
  ({
    _id: id,
    installerCode,
    fullName: "Ali Khan",
    cnic: "35202-1234567-1",
    phoneNumber: "03001234567",
    whatsappNumber: "+923001234567",
    address: "Street 1",
    city: "Lahore",
    province: "Punjab",
    district: "Lahore",
    bankName: "HBL",
    accountNumber: "PK00HABB0000000000000000",
    accountTitle: "ALI KHAN",
    certified: true,
    registeredBy: { name: "Admin" },
    createdAt: new Date("2026-01-05"),
  }) as unknown as ReportInstaller;

const reward = (
  installerId: string,
  serialNumber: string,
  productModel: string,
  rewardAmount: number
): ReportReward =>
  ({
    installer: installerId,
    installerCode: "FR-001",
    serialNumber,
    inverterSerialNumber: "",
    productModel,
    cityOfInstallation: "Lahore",
    bankName: "HBL",
    accountNumber: "PK00HABB0000000000000000",
    accountTitle: "ALI KHAN",
    rewardStatus: "PAID",
    rewardAmount,
    createdAt: new Date("2026-02-01"),
  }) as unknown as ReportReward;

const products = [
  {
    name: "TP LD-51 Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
    active: true,
  },
];

describe("buildCompleteInstallerRows", () => {
  it("emits one row per submitted product with the profile repeated", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001")],
      [
        reward("i1", "SN1", "TP LD-51 Battery", 1500),
        reward("i1", "SN2", "TP LD-51 Battery", 1500),
      ],
      products
    );

    expect(rows).toHaveLength(2);
    expect(rows[0][CODE_COL]).toBe("FR-001");
    expect(rows[1][CODE_COL]).toBe("FR-001");
    expect(rows.map((r) => r[SERIAL_COL])).toEqual(["SN1", "SN2"]);
    expect(rows[0][COUNT_COL]).toBe(2);
    expect(rows[0][TOTAL_COL]).toBe(3000);
  });

  it("joins the product catalogue onto each submission", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001")],
      [reward("i1", "SN1", "TP LD-51 Battery", 1500)],
      products
    );

    expect(rows[0][PRODUCT_REWARD_COL]).toBe(1500);
    expect(rows[0][BATTERY_COL]).toBe("Yes");
  });

  it("marks unknown product models N/A instead of dropping the row", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001")],
      [reward("i1", "SN1", "Discontinued Model", 1500)],
      products
    );

    expect(rows).toHaveLength(1);
    expect(rows[0][PRODUCT_REWARD_COL]).toBe("N/A");
  });

  it("keeps installers with no submissions, padded to the column count", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001")],
      [],
      products
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(COMPLETE_INSTALLER_COLUMNS.length);
    expect(rows[0][COUNT_COL]).toBe(0);
    expect(rows[0][TOTAL_COL]).toBe(0);
    expect(rows[0][SERIAL_COL]).toBe("");
  });

  it("produces rows that line up with the column headers", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001"), installer("i2", "FR-002")],
      [reward("i1", "SN1", "TP LD-51 Battery", 1500)],
      products
    );

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveLength(COMPLETE_INSTALLER_COLUMNS.length);
    }
  });

  it("does not leak one installer's submissions onto another", () => {
    const rows = buildCompleteInstallerRows(
      [installer("i1", "FR-001"), installer("i2", "FR-002")],
      [
        reward("i1", "SN1", "TP LD-51 Battery", 1500),
        reward("i2", "SN2", "TP LD-51 Battery", 2000),
      ],
      products
    );

    const byCode = new Map(rows.map((r) => [r[CODE_COL], r]));
    expect(byCode.get("FR-001")?.[SERIAL_COL]).toBe("SN1");
    expect(byCode.get("FR-002")?.[SERIAL_COL]).toBe("SN2");
    expect(byCode.get("FR-002")?.[TOTAL_COL]).toBe(2000);
  });
});
