import { TeamRole } from "./roles";

declare global {
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    fill?: boolean;
    duotone?: boolean;
    width?: string | number;
    opacity?: string | number;
    onClick?: React.MouseEventHandler<SVGSVGElement>;
  }

  interface TeamUser {
    id?: string;
    name?: string | null | undefined;
    role?: TeamRole;
    email?: string | null | undefined;
    image?: string | null | undefined;
  }
}

export {};
