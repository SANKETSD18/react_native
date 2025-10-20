import { Stack } from "expo-router";
import AuthProvider from "../app/providers/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Alert } from "react-native";



export default function RootLayout() {
  const router = useRouter();
  
  const [isReady, setIsReady] = useState(false);

  // ✅ PEHLE DEEP LINK CHECK KARO (highest priority)
  useEffect(() => {
    const initializeApp = async () => {
      // Check initial URL immediately
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl) {
        // console.log("🔗 Initial URL:", initialUrl);
        await handleDeepLink(initialUrl);
      }

      setIsReady(true);
    };

    initializeApp();
  }, []);

  // ✅ DEEP LINK HANDLER
  const handleDeepLink = async (url: string) => {
    // console.log("🔗 Processing deep link:", url);
    // console.log("🔗 Raw URL:", url);

    // Check for errors
    if (url.includes("error=")) {
      const fixedUrl = url.replace("#", "?");
      const { queryParams } = Linking.parse(fixedUrl);

      const error = queryParams?.error as string;
      const errorDescription = queryParams?.error_description as string;

      if (error === "access_denied") {
        Alert.alert(
          "Link Expired",
          "This password reset link has expired. Please request a new one.",
          [
            {
              text: "Request New Link",
              onPress: () => router.replace("/forgot-password"),
            },
          ]
        );
      }
      return;
    }

    // ✅ Handle Supabase callback URL format
    let fixedUrl = url;

    if (url.includes("#")) {
      const [baseUrl, hashParams] = url.split("#");
      if (hashParams) {
        fixedUrl = `${baseUrl}?${hashParams}`;
      }
    }

    const parsedUrl = Linking.parse(fixedUrl);

    // console.log("📍 Parsed URL:", {
    //   path: parsedUrl.path,
    //   hostname: parsedUrl.hostname,
    //   queryParams: parsedUrl.queryParams,
    // });

    const token = parsedUrl.queryParams?.access_token as string;
    const refreshToken = parsedUrl.queryParams?.refresh_token as string;
    const type = parsedUrl.queryParams?.type as string;

    // console.log("🔑 Auth details:", {
    //   hasToken: !!token,
    //   hasRefreshToken: !!refreshToken,
    //   type: type,
    // });

    // ✅ Password recovery
    if (type === "recovery" && token && refreshToken) {
      console.log("🔑 Password recovery flow starting...");

      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("❌ Session error:", error);
    
        Alert.alert("Error", "Unable to verify reset link.");
        router.replace("/forgot-password");
      } else {
        await supabase.auth.signOut();
        console.log("✅ Session set successfully");
        console.log("✅ User:", data.user?.email);

        setTimeout(() => {
          console.log("🚀 Navigating to reset-password...");
          router.replace("/reset-password");
          
        }, 300);
      }
      return;
    }

    // ✅ Email confirmation
    if (type === "signup" && token && refreshToken) {
      console.log("✅ Signup confirmation");

      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });

      router.replace("/(tabs)");
      return;
    }

    // ✅ REMOVED - Unnecessary path navigation block that was causing TypeScript error
    // All auth flows are already handled above
  };

  // ✅ DEEP LINK LISTENER (for app running in background/foreground)
  useEffect(() => {
    if (!isReady) return;

    const subscription = Linking.addEventListener("url", (event) => {
      console.log("🔗 Deep link received (app running):", event.url);
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, [isReady]);

  // ✅ Don't render until deep link is checked
  if (!isReady) {
    return null; // Or your loading screen
  }

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="reset-password"
          options={{
            headerShown: false,
            gestureEnabled: false, // ✅ Swipe back disable
            headerBackVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
