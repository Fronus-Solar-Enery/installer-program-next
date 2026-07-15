import { describe, it, expect } from "vitest";
import { buildWelcomeTemplateComponents } from "@/lib/whatsappService";

// hello_installer positional mapping is load-bearing: a swap sends the PIN into
// the code field (and vice versa) with no runtime error, only a wrong message.
describe("buildWelcomeTemplateComponents", () => {
  const components = buildWelcomeTemplateComponents({
    fullName: "Ali Khan",
    installerCode: "LHR-001",
    pin: "482913",
  });

  it("maps the header param to full name", () => {
    const header = components.find((c) => c.type === "header");
    expect(header?.parameters).toEqual([{ type: "text", text: "Ali Khan" }]);
  });

  it("maps body {{1}} to installer code and {{2}} to PIN, in order", () => {
    const body = components.find((c) => c.type === "body");
    expect(body?.parameters).toEqual([
      { type: "text", text: "LHR-001" },
      { type: "text", text: "482913" },
    ]);
  });
});
