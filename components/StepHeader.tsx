"use client";

import { motion, type Variants } from "framer-motion";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface StepHeaderProps {
  icon: React.FC<IconProps>;
  title: string;
  description: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      // delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function StepHeader({
  icon: Icon,
  title,
  description,
}: StepHeaderProps) {
  return (
    <CardHeader className="p-6 rounded-3xl border text-card-foreground bg-card border-border">
      <CardTitle className="text-base flex items-center gap-2">
        <Icon className="h-12 w-12 mr-2 text-primary" fill opacity="0.2" />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2 variants={itemVariants} className="text-xl">
            {title}
          </motion.h2>
          <motion.div
            variants={itemVariants}
            className="text-sm text-muted-foreground font-normal"
          >
            {description}
          </motion.div>
        </motion.div>
      </CardTitle>
    </CardHeader>
  );
}
