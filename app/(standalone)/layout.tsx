import BootSplash from "@/components/landing/BootSplash";

export default function StandaloneLayout({
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
