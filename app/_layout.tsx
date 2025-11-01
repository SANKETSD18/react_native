import { router, Stack } from "expo-router";
import AuthProvider from "../app/providers/AuthProvider";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { usePathname } from "expo-router";
// import { supabase } from "../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const path = usePathname();

  // ✅ Just for debug
  useEffect(() => {
    const scheme = Linking.createURL("");
    const full = `${scheme.replace(/\/$/, "")}${path}`;
    console.log("🛣️ Current full URL:", full);
  }, [path]);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log("🔗 Handling link:", url);
      if (!url) return;

      let fixedUrl = url;
      if (fixedUrl.includes("#")) {
        const [base, hash] = fixedUrl.split("#");
        fixedUrl = `${base}?${hash}`;
      }

      try {
        const parsed = Linking.parse(fixedUrl);
        console.log("🧩 Parsed link printed ✅", parsed);

        const { access_token, type } = parsed.queryParams || {};
        const token = access_token as string | undefined;
        const flowType = type as string | undefined;

        if (token && flowType === "recovery") {
          console.log("🔑 Token mila ✅", token, "Type:", flowType);
          await AsyncStorage.setItem("reset_token", token);
          await AsyncStorage.setItem("auth_event", "PASSWORD_RECOVERY");
          console.log("💾 Token + PASSWORD_RECOVERY saved ✅");
        } else {
          console.log("🚫 Token ya type nahi mila");
        }

        console.log("🔚 HandleDeepLink finished ✅");
      } catch (err) {
        console.log("❌ Error while parsing link:", err);
      }
    };

    // ✅ Listen when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("📩 Deep link received while running:", event.url);
      handleDeepLink(event.url);
    });

    // ✅ Handle link when app opened from cold start
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("🚀 App opened via deep link:", initialUrl);
        await handleDeepLink(initialUrl);
      } else {
        console.log("🕵️‍♂️ No initial URL found (normal app start).");
      }
    })();

    // ✅ Cleanup listener
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
