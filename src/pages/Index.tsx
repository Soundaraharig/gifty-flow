import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import StatsAndCTA from "@/components/StatsAndCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <Testimonials />
      <StatsAndCTA />
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© 2026 Zero Gifts. Handcrafted with ❤️</p>
      </footer>
    </div>
  );
};

export default Index;

