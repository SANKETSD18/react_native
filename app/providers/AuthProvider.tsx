import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useDeepLink } from "../../context/DeepLinkContext";
import { supabase } from "../../lib/supabaseClient";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isDeepLinkChecked, isRecoveryMode, setIsRecoveryMode } = useDeepLink();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  // ✅ Track if we're currently in password reset flow
  const isResettingPassword = useRef(false);

  const fetchRole = async (email: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .single();

      if (error) {
        console.error("❌ Role fetch error:", error);
        return "user";
      }

      return profileData?.role || "user";
    } catch (err) {
      console.error("❌ Role fetch exception:", err);
      return "user";
    }
  };

  // ✅ Initialize auth on mount
  useEffect(() => {
    if (!isDeepLinkChecked) return;

    const initAuth = async () => {
      console.log("🔐 Initializing auth...");

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession?.user && !isRecoveryMode) {
        console.log("✅ Found existing session:", currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        const userRole = await fetchRole(currentSession.user.email || "");
        setRole(userRole);
      } else {
        console.log("❌ No existing session or in recovery mode");
        setSession(null);
        setUser(null);
        setRole(null);
      }
    };

    initAuth();
  }, [isDeepLinkChecked]);

  // ✅ Auth state listener with proper recovery mode handling
  useEffect(() => {
    console.log("🎯 Setting up auth listener. Recovery mode:", isRecoveryMode);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("🔔 Auth event:", event, "| Recovery mode:", isRecoveryMode);

      // ✅ PASSWORD_RECOVERY or SIGNED_IN during recovery - DON'T navigate
      if (isRecoveryMode && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY")) {
        console.log("🔒 Recovery mode: Blocking navigation for", event);
        setSession(currentSession || null);
        setUser(currentSession?.user || null);
        isResettingPassword.current = true;
        return; // ✅ Don't proceed further
      }

      // ✅ USER_UPDATED during password reset - DON'T navigate
      if (event === "USER_UPDATED" && isResettingPassword.current) {
        console.log("🔄 User updated during password reset - skipping navigation");
        setSession(currentSession || null);
        setUser(currentSession?.user || null);
        // Don't navigate, password reset screen will handle it
        return;
      }

      // ✅ Normal SIGNED_IN - User logged in (not recovery)
      if (event === "SIGNED_IN" && currentSession?.user && !isRecoveryMode) {
        console.log("✅ Normal sign in - navigating to tabs");
        setSession(currentSession);
        setUser(currentSession.user);
        const userRole = await fetchRole(currentSession.user.email || "");
        setRole(userRole);
        router.replace("/(tabs)");
      }

      // ✅ SIGNED_OUT - User logged out
      if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
        setSession(null);
        setUser(null);
        setRole(null);
        isResettingPassword.current = false;
        setIsRecoveryMode(false);

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 100);
      }

      // ✅ TOKEN_REFRESHED - Just update session, no navigation
      if (event === "TOKEN_REFRESHED" && currentSession?.user) {
        console.log("🔄 Token refreshed");
        setSession(currentSession);
        setUser(currentSession.user);
      }

      // ✅ Normal USER_UPDATED (not during password reset)
      if (event === "USER_UPDATED" && currentSession?.user && !isResettingPassword.current) {
        console.log("🔄 User profile updated");
        setSession(currentSession);
        setUser(currentSession.user);
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [isRecoveryMode]); // ✅ Add isRecoveryMode as dependency

  return (
    <AuthContext.Provider value={{ user, session, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};