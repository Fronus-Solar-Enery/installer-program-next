import {
  Users,
  Gift,
  FileText,
  Settings,
  Activity,
  Upload,
  Plus,
  Edit,
  House,
  Package,
} from "lucide-react";

interface IconProps {
  className?: string;
  fill?: boolean;
}

// Wrapper component to handle fill prop properly
const IconWrapper = ({
  Icon,
  className,
  fill,
}: {
  Icon: React.ComponentType<{ className?: string; fill?: string }>;
  className?: string;
  fill?: boolean;
}) => {
  return <Icon className={className} fill={fill ? "currentColor" : "none"} />;
};

// Map of route segments to their icons
export const routeIconMap: Record<string, React.FC<IconProps>> = {
  dashboard: (props) => <IconWrapper Icon={House} {...props} />,
  installers: (props) => <IconWrapper Icon={Users} {...props} />,
  rewards: (props) => <IconWrapper Icon={Gift} {...props} />,
  reports: (props) => <IconWrapper Icon={FileText} {...props} />,
  settings: (props) => <IconWrapper Icon={Settings} {...props} />,
  team: (props) => <IconWrapper Icon={Users} {...props} />,
  activity: (props) => <IconWrapper Icon={Activity} {...props} />,
  new: (props) => <IconWrapper Icon={Plus} {...props} />,
  edit: (props) => <IconWrapper Icon={Edit} {...props} />,
  "bulk-register": (props) => <IconWrapper Icon={Upload} {...props} />,
  "bulk-create": (props) => <IconWrapper Icon={Package} {...props} />,
};

// Get icon for a route segment
export function getRouteIcon(segment: string): React.FC<IconProps> | undefined {
  return routeIconMap[segment.toLowerCase()];
}
