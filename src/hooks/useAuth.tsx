import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  isAdmin: boolean;
  isSubscriber: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  isAdmin: false,
  isSubscriber: false,
  subscriptionEnd: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  checkSubscription: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdmin = (userId: string) => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        setIsAdmin(!error && !!data);
        setLoading(false);
      });
  };

  const checkSubscriberRole = (userId: string) => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "subscriber")
      .maybeSingle()
      .then(({ data, error }) => {
        setIsSubscriber(!error && !!data);
      });
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setIsSubscriber(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        checkAdmin(u.id);
        checkSubscriberRole(u.id);
        checkSubscription();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          checkAdmin(u.id);
          checkSubscriberRole(u.id);
          checkSubscription();
        } else {
          setIsAdmin(false);
          setIsSubscriber(false);
          setSubscriptionEnd(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Periodic subscription check every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

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
    setSubscriptionEnd(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSubscriber, subscriptionEnd, loading, signInWithGoogle, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
