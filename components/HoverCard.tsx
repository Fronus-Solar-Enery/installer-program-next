import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface HoverCardProps {
  trigger: string | React.ReactNode;
  content?: string | React.ReactNode;
  asChild?: boolean;
}
const HoverCard = ({ trigger, content, asChild }: HoverCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>{trigger}</TooltipTrigger>
        <TooltipContent>{content || trigger}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HoverCard;
