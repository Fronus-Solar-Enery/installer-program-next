import {
  IconActivity,
  IconAdd,
  IconDashboard,
  IconDocument,
  IconEdit,
  IconGift,
  IconInstaller,
  IconSettings,
  IconUploadMinimalistic,
  IconUsersGroupRounded,
} from "./icons";

const IconWrapper = ({
  Icon,
  className,
  fill,
}: {
  Icon: React.FC<IconProps>;
  className?: string;
  fill?: boolean;
}) => {
  return <Icon className={className} fill={fill} duotone />;
};

// Map of route segments to their icons
export const routeIconMap: Record<string, React.FC<IconProps>> = {
  dashboard: (props) => <IconWrapper Icon={IconDashboard} {...props} />,
  installers: (props) => <IconWrapper Icon={IconInstaller} {...props} />,
  rewards: (props) => <IconWrapper Icon={IconGift} {...props} />,
  reports: (props) => <IconWrapper Icon={IconDocument} {...props} />,
  settings: (props) => <IconWrapper Icon={IconSettings} {...props} />,
  team: (props) => <IconWrapper Icon={IconUsersGroupRounded} {...props} />,
  activity: (props) => <IconWrapper Icon={IconActivity} {...props} />,
  new: (props) => <IconWrapper Icon={IconAdd} {...props} />,
  edit: (props) => <IconWrapper Icon={IconEdit} {...props} />,
  "bulk-register": (props) => (
    <IconWrapper Icon={IconUploadMinimalistic} {...props} />
  ),
  "bulk-create": (props) => (
    <IconWrapper Icon={IconUploadMinimalistic} {...props} />
  ),
};

// Get icon for a route segment
export function getRouteIcon(segment: string): React.FC<IconProps> | undefined {
  return routeIconMap[segment.toLowerCase()];
}
