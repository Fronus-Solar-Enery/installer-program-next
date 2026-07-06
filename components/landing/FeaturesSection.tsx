"use client";

import { motion } from "framer-motion";
import {
  IconMoney,
  IconGift,
  IconWhatsapp,
  IconShieldStar,
  IconChart,
  IconShare,
} from "@/components/icons";
import { staggerContainer, slideUp, VIEWPORT_ONCE } from "@/lib/motion";

const FEATURES = [
  {
    icon: IconMoney,
    title: "Rewards for Every Install",
    body: "Every registered installation earns a cash reward, paid directly to your bank account.",
  },
  {
    icon: IconGift,
    title: "Referral Bonuses",
    body: "Refer other installers to the program and earn a bonus for their installations too.",
  },
  {
    icon: IconWhatsapp,
    title: "WhatsApp Updates",
    body: "Get your login PIN, payment confirmations, and referral bonuses straight on WhatsApp.",
  },
  {
    icon: IconChart,
    title: "Live Reward Tracking",
    body: "See every installation, its status, and your total earnings in your personal dashboard.",
  },
  {
    icon: IconShieldStar,
    title: "Verified Installer Badge",
    body: "Certified installers get a verified badge on their public profile — proof customers can trust.",
  },
  {
    icon: IconShare,
    title: "Shareable Profile",
    body: "Share your installer page on WhatsApp to show customers your track record.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="space-y-12"
      >
        <motion.div variants={slideUp} className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything an installer needs
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            One system for installations, rewards, referrals, and payments —
            built for Fronus installers across Pakistan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={slideUp}
              className="squircle rounded-3xl border border-border/60 bg-card p-6 space-y-3 hover:border-brand-700/50 transition-colors"
            >
              <div className="squircle rounded-2xl size-11 bg-brand-400 dark:bg-brand-1100 flex items-center justify-center">
                <feature.icon className="size-5.5 text-brand-1000 dark:text-brand-600" />
              </div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
