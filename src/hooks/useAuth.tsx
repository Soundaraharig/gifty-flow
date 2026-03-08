import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  isAdmin: boolean;
  isSubscriber: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  isAdmin: false,
  isSubscriber: false,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRole = (userId: string) => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setIsAdmin(data.role === "admin");
          setIsSubscriber(data.role === "subscriber");
        } else {
          setIsAdmin(false);
          setIsSubscriber(false);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    // Restore session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        checkRole(u.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          checkRole(u.id);
        } else {
          setIsAdmin(false);
          setIsSubscriber(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const isCustomDomain =
      !window.location.hostname.includes("lovable.app") &&
      !window.location.hostname.includes("lovableproject.com");

    if (isCustomDomain) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } else {
      const { lovable } = await import("@/integrations/lovable/index");
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsSubscriber(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSubscriber, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
