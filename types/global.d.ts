import { TeamRole } from "./roles";

declare global {
  interface IconProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
    width?: string | number;
    opacity?: string | number;
    onClick?: () => void;
  }
  interface SidebarUser {
    id?: string;
    name?: string | null | undefined;
    role?: TeamRole;
    email?: string | null | undefined;
    image?: string | null | undefined;
  }
}

export {};
