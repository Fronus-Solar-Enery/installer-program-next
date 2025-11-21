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
}
const HoverCard = ({ trigger, content }: HoverCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{trigger}</TooltipTrigger>
        <TooltipContent>{content || trigger}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HoverCard;
