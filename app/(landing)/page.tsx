import type { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { RewardStatus } from "@/types/rewards";
import LandingPage from "@/components/landing/LandingPage";
import { logger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Fronus Installer Program — Earn Rs 5,000 per Install",
  description:
    "Join Pakistan's solar installer reward program. Earn a flat Rs 5,000 on every eligible Fronus-SolaX inverter installation. Free to join, no exclusivity, payments straight to your bank.",
  keywords: [
    "Fronus solar installer",
    "solar inverter rewards Pakistan",
    "installer reward program",
    "Fronus SolaX",
    "solar technician earnings",
    "inverter installation reward",
  ],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "/",
    siteName: "Fronus Installer Program",
    title: "Fronus Installer Program — Earn Rs 5,000 per Install",
    description:
      "Join Pakistan's solar installer reward program. Earn a flat Rs 5,000 on every eligible Fronus-SolaX inverter installation.",
    images: [
      {
        url: "og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Fronus Installer Program — Earn Rs 5,000 per Install",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fronus Installer Program — Earn Rs 5,000 per Install",
    description:
      "Join Pakistan's solar installer reward program. Earn a flat Rs 5,000 on every eligible Fronus-SolaX inverter installation.",
    images: ["og-image.jpeg"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

async function getLandingStats() {
  try {
    await dbConnect();
    const [installers, installations, paidAgg] = await Promise.all([
      Installer.countDocuments(),
      InstallerReward.countDocuments(),
      InstallerReward.aggregate([
        { $match: { rewardStatus: RewardStatus.PAID } },
        { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
      ]),
    ]);
    return {
      installers,
      installations,
      rewardsPaid: paidAgg[0]?.total ?? 0,
    };
  } catch (error) {
    // Landing page must render even if the DB is unreachable.
    logger.error("Failed to load landing stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { installers: 0, installations: 0, rewardsPaid: 0 };
  }
}

export default async function Home() {
  return <LandingPage stats={await getLandingStats()} />;
}
