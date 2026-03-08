import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, isAdmin, loading, signInWithGoogle, signOut } = useAuth();
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
        <nav className="flex items-center gap-4">
          <a href="/categories" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Categories
          </a>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Admin
            </button>
          )}
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.user_metadata?.avatar_url || ""}
                alt=""
                className="h-8 w-8 rounded-full border border-border"
              />
              <button
                onClick={signOut}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-rose hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
