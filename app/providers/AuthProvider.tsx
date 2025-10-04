import { User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Context type
type AuthContextType = {
  user: User | null;
  role: string | null;
};

// Create context with correct type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};
const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        fetchRole(data.user.email ?? '');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchRole(session.user.email ?? '');
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRole = async (email: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();

    setRole(profileData?.role ?? "user");
  };

  return (
    <AuthContext.Provider value={{ user, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; // 👈 default export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
