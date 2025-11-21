import React from "react";

interface UnavailableProps {
  title?: string;
}
const Unavailable = ({ title = "unavailable" }: UnavailableProps) => {
  return <div className="text-xs text-muted-foreground italic">{title}</div>;
};

export default Unavailable;
