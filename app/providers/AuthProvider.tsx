import { User, Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../../lib/supabaseClient";
import { router } from "expo-router";

// ✅ Context type - session added
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  

  // ✅ Fetch role function
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

      // console.log("👤 User role:", profileData?.role);
      return profileData?.role || "user";
    } catch (err) {
      console.error("❌ Role fetch exception:", err);
      return "user";
    }
  };

  // ✅ Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // console.log("🔐 Initializing auth...");

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession?.user) {
        // console.log("✅ Found existing session:", currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        const userRole = await fetchRole(currentSession.user.email || "");
        setRole(userRole);
      } else {
        // console.log("❌ No existing session");
        setSession(null);
        setUser(null);
        setRole(null);
      }
    };

    initAuth();
  }, []);

  // ✅ Auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // console.log("🔔 Auth event:", event);

      // ✅ PASSWORD_RECOVERY - Don't navigate
      if (event === "PASSWORD_RECOVERY") {
        // console.log("🔑 Password recovery detected - staying on reset screen");
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const userRole = await fetchRole(currentSession.user.email || "");
          setRole(userRole);
        }
        return;
      }

      // ✅ SIGNED_IN - User logged in
      if (event === "SIGNED_IN" && currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const userRole = await fetchRole(currentSession.user.email || "");
        setRole(userRole);

        // ✅ BLOCK: Only navigate to tabs if NOT in recovery
       
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 100);
        
      }

      // ✅ SIGNED_OUT - User logged out
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setRole(null);
       

        // Navigate to login screen after reset/cancel
        setTimeout(() => {
          router.replace("/(tabs)"); // ya "/" ya login screen ke route par
        }, 100);
      }

      // ✅ TOKEN_REFRESHED - Update session
      if (event === "TOKEN_REFRESHED" && currentSession?.user) {
        // console.log("🔄 Token refreshed");
        setSession(currentSession);
        setUser(currentSession.user);
      }

      // ✅ USER_UPDATED - Update user
      if (event === "USER_UPDATED" && currentSession?.user) {
        // console.log("🔄 User updated");
        setSession(currentSession);
        setUser(currentSession.user);
      }
    });

    return () => {
      // console.log("🧹 Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, role, }}
    >
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
