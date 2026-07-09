import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { RewardStatus } from "@/types/rewards";
import ProgramLogo from "@/components/ProgramLogo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// components/ui/card is client-only (imports framer-motion); this page is a
// server component, so use the same card classes on plain divs.
const cardClass =
  "squircle rounded-3xl border text-card-foreground bg-card border-border overflow-hidden";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className={cn(cardClass, "text-center py-6 px-4 space-y-1.5")}>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ installerCode: string }>;
}

// Public shareable profile — non-sensitive fields only (no CNIC, phone, bank).
async function getProfile(installerCode: string) {
  await dbConnect();

  const installer = await Installer.findOne({
    installerCode: installerCode.toUpperCase(),
  }).select(
    "installerCode fullName companyName city district certified createdAt",
  );

  if (!installer) return null;

  const rewards = await InstallerReward.find({
    installer: installer._id,
  }).select("rewardAmount rewardStatus");

  return {
    installer,
    installationCount: rewards.length,
    totalEarned: rewards
      .filter((r) => r.rewardStatus === RewardStatus.PAID)
      .reduce((sum, r) => sum + r.rewardAmount, 0),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { installerCode } = await params;
  const profile = await getProfile(installerCode);
  if (!profile) return { title: "Installer Not Found" };
  return {
    title: `${profile.installer.fullName} — Fronus Verified Installer`,
    description: `${profile.installer.fullName} is a Fronus installer in ${profile.installer.city} with ${profile.installationCount} installations.`,
  };
}

export default async function InstallerProfilePage({ params }: PageProps) {
  const { installerCode } = await params;
  const profile = await getProfile(installerCode);
  if (!profile) notFound();

  const { installer, installationCount, totalEarned } = profile;
  const memberSince = installer.createdAt
    ? new Date(installer.createdAt).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-2xl w-full mx-auto px-4 py-10 flex-1 space-y-8">
        <header className="flex justify-center">
          <ProgramLogo className="w-32" />
        </header>

        <div className={cn(cardClass, "text-center px-6 py-10 space-y-4")}>
          <div className="mx-auto size-20 rounded-full bg-brand-500 dark:bg-brand-1100 flex items-center justify-center text-3xl font-bold text-brand-1100 dark:text-brand-500">
            {installer.fullName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {installer.fullName}
            </h1>
            {installer.companyName && (
              <p className="text-base text-muted-foreground">
                {installer.companyName}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {installer.city}, {installer.district}
              {memberSince && ` · Member since ${memberSince}`}
            </p>
          </div>
          {installer.certified && (
            <Badge className="mx-auto bg-brand-700/25 text-brand-1000 dark:text-brand-600 border-transparent px-3 py-1">
              ✓ Verified Installer
            </Badge>
          )}
          <p className="font-mono text-sm tracking-widest text-muted-foreground">
            {installer.installerCode}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            value={installationCount.toLocaleString()}
            label="Total Installations"
          />
          <StatCard
            value={`Rs. ${totalEarned.toLocaleString()}`}
            label="Rewards Earned"
          />
        </div>
      </div>

      <footer className="py-6 text-xs text-center text-muted-foreground">
        Fronus Installer Program &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
