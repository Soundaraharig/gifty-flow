import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, LogIn, ShoppingCart, Crown } from "lucide-react";

const Header = () => {
  const { user, isAdmin, isSubscriber, loading, signInWithGoogle, signOut } = useAuth();
  const { totalItems } = useCart();
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
          <a href="/categories" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Categories
          </a>
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
          {/* Subscribe button for non-subscribers */}
          {!isAdmin && !isSubscriber && user && (
            <button
              onClick={() => navigate("/subscribe")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              title="Subscribe"
            >
              <Crown size={14} />
              Subscribe
            </button>
          )}
          {(isAdmin || isSubscriber) && (
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
              title={isAdmin ? "Admin Dashboard" : "Subscriber Dashboard"}
            >
              {isAdmin ? <Shield size={20} /> : <Crown size={20} />}
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
