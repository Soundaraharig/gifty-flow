import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, LogIn, ShoppingCart, Sun, Moon, Crown } from "lucide-react";

const Header = () => {
  const { user, isAdmin, isSubscriber, loading, signInWithGoogle, signOut } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="Zero Gifts" className="h-10 w-10 object-contain" />
          <span className="font-display text-xl font-semibold text-foreground">
            Zero Gifts
          </span>
        </a>
        <nav className="flex items-center gap-3">
          <a href="/scan-frame" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors font-semibold px-2 py-1 rounded-md hover:bg-primary/5">
            Scan Frame
          </a>
          <a href="/categories" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Categories
          </a>
          <a href="/assistant" className="hidden md:inline text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            AI Assistant
          </a>
          {/* VIP Crown - visible to all logged-in users */}
          {user && (
            <button
              onClick={() => navigate("/subscribe")}
              className={`p-2 rounded-full transition-colors ${
                isSubscriber
                  ? "text-primary bg-primary/10 animate-pulse"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
              title={isSubscriber ? "VIP Subscriber" : "Become a VIP"}
            >
              <Crown size={20} />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {/* Cart icon */}
          <button
            onClick={() => navigate("/cart")}
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Cart"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
          {(isAdmin || isSubscriber) && (
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
              title={isAdmin ? "Admin Dashboard" : "Subscriber Dashboard"}
            >
              <Shield size={20} />
            </button>
          )}
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.user_metadata?.avatar_url || ""}
                alt=""
                className="h-8 w-8 rounded-full border border-border"
              />
              <button
                onClick={signOut}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-rose hover:opacity-90 transition-opacity"
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
