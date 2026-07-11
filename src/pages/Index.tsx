import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import StatsAndCTA from "@/components/StatsAndCTA";
import { Link, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const pendingRedirect = sessionStorage.getItem("auth_redirect");
      if (pendingRedirect) {
        sessionStorage.removeItem("auth_redirect");
        navigate(pendingRedirect, { replace: true });
      }
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <Testimonials />
      <StatsAndCTA />
      
      {/* Pulsing Radar-Style Glassmorphic Floating Action Button for AR Scanner */}
      <Link
        to="/scan-frame"
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-5 py-3.5 rounded-full glass-card bg-card/60 hover:bg-primary/15 text-primary border border-primary/30 shadow-rose group transition-all duration-300 active:scale-95 hover:scale-105"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
        <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        <span className="font-semibold text-xs font-body tracking-wide uppercase">Scan Frame</span>
      </Link>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© 2026 Zero Gifts. Handcrafted with ❤️</p>
      </footer>
    </div>
  );
};

export default Index;

