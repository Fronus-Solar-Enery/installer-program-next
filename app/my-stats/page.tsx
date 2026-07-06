import { redirect } from "next/navigation";
import { getInstallerFromCookie } from "@/lib/installerAuth";
import MyStatsDashboard from "./MyStatsDashboard";

export const metadata = {
  title: "My Stats — Fronus Installer Program",
};

export default async function MyStatsPage() {
  const session = await getInstallerFromCookie();
  if (!session) {
    redirect("/auth/installer");
  }

  return <MyStatsDashboard />;
}
