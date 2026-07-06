import Header from "./Header";
import HeroSection from "./HeroSection";
import StatsSection, { type LandingStats } from "./StatsSection";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import ForInstallersSection from "./ForInstallersSection";
import CTASection from "./CTASection";
import Footer from "./Footer";

export default function LandingPage({ stats }: { stats: LandingStats }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <StatsSection stats={stats} />
        <FeaturesSection />
        <HowItWorksSection />
        <ForInstallersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
