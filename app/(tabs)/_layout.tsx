// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRole(uid?: string | null) {
      if (!uid) { if (mounted) { setRole(null); setReady(true); } return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if (mounted) { setRole(data?.role ?? null); setReady(true); }
    }

    // Initial session
    supabase.auth.getUser().then(({ data: { user } }) => loadRole(user?.id));

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(false);
      loadRole(session?.user?.id ?? null);
    });

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Important: Always return Tabs; control visibility with href
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#1E325D",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height: 70,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={28} color={focused ? "#ffd900" : "#888"} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={28} color={focused ? "#FFEB3B" : "#888"} />
          ),
        }}
      />
      <Tabs.Screen
        name="pdfList"
        options={{
          // Hide until role is resolved and equals admin
          href: !ready || role !== "admin" ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={28} color={focused ? "#FFEB3B" : "#888"} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          href: !ready || role !== "admin" ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "cloud-upload" : "cloud-upload-outline"} size={28} color={focused ? "#FFEB3B" : "#888"} />
          ),
        }}
      />
    </Tabs>
  );
}
