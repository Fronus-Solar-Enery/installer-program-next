import BootSplash from "@/components/landing/BootSplash";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <noscript>
        <style>{`.boot-splash{display:none}`}</style>
      </noscript>
      <BootSplash />
      {children}
    </>
  );
}
