import { describe, it, expect } from "vitest";
import {
  buildRewardRegisteredMessage,
  formatRewardWhatsAppMessage,
  waMeUrl,
} from "@/lib/whatsappService";

const reward = {
  fullName: "Ali Khan",
  serialNumber: "SN123456789ABC",
  productModel: "X1-Hybrid-5.0",
  rewardAmount: 12500,
};

// The auto-send and the manual fallback must produce identical text — a drift
// here means the installer gets a different message depending on which path ran.
describe("buildRewardRegisteredMessage", () => {
  const text = buildRewardRegisteredMessage(reward);

  it("includes the installer name, product, serial and formatted amount", () => {
    expect(text).toContain("Hi Ali Khan,");
    expect(text).toContain("X1-Hybrid-5.0");
    expect(text).toContain("SN123456789ABC");
    expect(text).toContain("Rs. 12,500");
  });

  it("is the same text the manual fallback shares", () => {
    expect(formatRewardWhatsAppMessage(reward).text).toBe(text);
  });
});

describe("waMeUrl", () => {
  it("normalizes the number and url-encodes the message", () => {
    const url = waMeUrl("0300-1234567", "hi there");
    expect(url).toBe("https://wa.me/923001234567?text=hi%20there");
  });

  it("returns an empty string when there is no number to send to", () => {
    expect(waMeUrl(undefined, "hi")).toBe("");
    expect(formatRewardWhatsAppMessage(reward).whatsappUrl).toBe("");
  });
});
