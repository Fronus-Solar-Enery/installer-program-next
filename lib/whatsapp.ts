/**
 * WhatsApp conversion helpers for the Installer Program 2026 landing page.
 *
 * One source of truth for the destination number and the pre-filled message
 * templates. Every CTA on the page calls `buildWhatsAppUrl(intent)`, so copy
 * changes are a one-file edit and source tracking is automatic.
 *
 * Per blueprint §5 — multiple entry points, all route to the same number with
 * distinct, intent-specific pre-filled messages so the team triages leads fast.
 */

/** Canonical program WhatsApp number (international, no +). */
export const WHATSAPP_NUMBER = "923268280220";

export type WhatsAppIntent =
  | "join" // primary CTA — "Join the Installer Program"
  | "get-code" // already installing, wants installer code + PIN
  | "install-product" // clicked from a specific product card
  | "question"; // generic inquiry

/** Where on the page the CTA was clicked — appended as ?source= for analytics. */
export type WhatsAppSource =
  | "hero-primary"
  | "hero-secondary"
  | "product-card"
  | "final-cta"
  | "floating"
  | "header"
  | "header-mobile"
  | "footer";

interface MessageTemplates {
  [key: string]: (ctx?: { product?: string }) => string;
}

const MESSAGES: MessageTemplates = {
  join: () =>
    "Hi Fronus team 👋 I want to join the Installer Program 2026 and start earning the Rs 5,000 reward. Please register me and send my installer code.",
  "get-code": () =>
    "Hi, I'm already installing Fronus inverters and want my installer code + PIN so I can track my rewards.",
  "install-product": ({ product } = {}) =>
    `Hi, I want to install the ${product ?? "Fronus inverter"} for a customer. What do I need to register the install and claim my Rs 5,000 reward?`,
  question: () => "Hi, I have a question about the Fronus Installer Program.",
};

interface BuildWhatsAppUrlArgs {
  intent: WhatsAppIntent;
  /** Product display name, only used by the "install-product" intent. */
  product?: string;
  /** CTA placement, used for ?source= attribution. */
  source?: WhatsAppSource;
  /** Override the number if a dedicated line is added later. */
  number?: string;
}

/**
 * Build a wa.me deep link with a pre-filled, URL-encoded message.
 *
 * @example
 * buildWhatsAppUrl({ intent: "join", source: "hero-primary" })
 * // => "https://wa.me/923268280220?text=Hi%20Fronus...&source=hero-primary"
 */
export function buildWhatsAppUrl({
  intent,
  product,
  source,
  number = WHATSAPP_NUMBER,
}: BuildWhatsAppUrlArgs): string {
  const message = MESSAGES[intent]({ product });
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", message);
  if (source) url.searchParams.set("source", source);
  return url.toString();
}

/** Common rel/target attrs for opening WhatsApp in a new tab. */
export const WHATSAPP_LINK_ATTRS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
