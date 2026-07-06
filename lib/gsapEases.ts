import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

// GSAP core doesn't parse CSS cubic-bezier() strings — CustomEase must be
// registered, then a CSS cubic-bezier(x1,y1,x2,y2) becomes the SVG path
// "M0,0 C x1,y1 x2,y2 1,1". Named eases created here are shared by Sidebar.tsx
// and AppLayout.tsx so their width tweens use the exact same curve.
gsap.registerPlugin(CustomEase);

// --ease-fluid: cubic-bezier(0.7, 0, 0.2, 1) — resizing / morphing
export const EASE_MOVE = CustomEase.create("ease-move", "M0,0 C0.7,0 0.2,1 1,1");

// EASE_MOVE mirrored — the sidebar/main-content width tween
export const EASE_MOVE_REVERSE = CustomEase.create(
  "ease-move-reverse",
  "M0,0 C0.8,0 0.3,1 1,1",
);

// --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1) — enter / exit
export const EASE_ENTER = CustomEase.create(
  "ease-enter",
  "M0,0 C0.23,1 0.32,1 1,1",
);
