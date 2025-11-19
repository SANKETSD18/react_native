import { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const fetchRole = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .single();

      if (error) return "user";
      return data?.role || "user";
    } catch {
      return "user";
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("🔔 Auth event:", event);

      // -------------------------
      // 1️⃣ INITIAL_SESSION (normal only)
      // -------------------------
      if (event === "INITIAL_SESSION") {
        // console.log("ℹ️ Normal INITIAL_SESSION");
        setSession(currentSession || null);
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          const r = await fetchRole(currentSession.user.email || "");
          setRole(r);
        }

        return;
      }

      // -------------------------
      // 2️⃣ Normal USER_UPDATED
      // -------------------------
      if (event === "USER_UPDATED" && currentSession?.user) {
        // console.log("🔄 USER_UPDATED");
        setSession(currentSession);
        setUser(currentSession.user);
        return;
      }

      // -------------------------
      // 3️⃣ Normal SIGNED_IN
      // -------------------------
      if (event === "SIGNED_IN" && currentSession?.user) {
        const recovery = await AsyncStorage.getItem("is_recovery_mode");

        if (recovery === "true") {
          console.log("⛔ Recovery mode → redirect skipped");
          

          setSession(currentSession);
          setUser(currentSession.user);
          return;
        }

        // NORMAL LOGIN FLOW
        setSession(currentSession);
        setUser(currentSession.user);
        router.replace("/(tabs)");
      }

      // -------------------------
      // 4️⃣ SIGNED_OUT
      // -------------------------
      if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");

        setSession(null);
        setUser(null);
        setRole(null);

        router.replace("/(tabs)");
      }

      // -------------------------
      // 5️⃣ TOKEN_REFRESHED
      // -------------------------
      if (event === "TOKEN_REFRESHED" && currentSession?.user) {
        console.log("🔄 Token Refreshed");
        setSession(currentSession);
        setUser(currentSession.user);
      }
      if (event === "PASSWORD_RECOVERY") {
        console.log("⚠ IGNORING SIGNED_IN because recovery mode active");
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
