import { supabase } from "@/lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router, Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import AuthProvider from "../app/providers/AuthProvider";
import { DeepLinkProvider, useDeepLink } from "../context/DeepLinkContext";

function AppContent() {
  const path = usePathname();
  const { setIsDeepLinkChecked } = useDeepLink();

  // useEffect(() => {
  //   const showAllLocalStorage = async () => {
  //     try {
  //       const keys = await AsyncStorage.getAllKeys();
  //       const items = await AsyncStorage.multiGet(keys);

  //       console.log("📦 Local Storage Items:");
  //       items.forEach(([key, value]) => {
  //         console.log(`• ${key}:`, value);
  //       });
  //     } catch (error) {
  //       console.log("❌ Error reading local storage:", error);
  //     }
  //   };

  //   showAllLocalStorage();
  // }, []);
  useEffect(() => {
    const handleReloadRecovery = async () => {
      const flag = await AsyncStorage.getItem("is_recovery_mode");
      if (flag === "true") {
        console.log("🔄 Reload detected during recovery → clearing session");

        // Supabase session clear
        await supabase.auth.signOut();

        // Local storage session भी clear
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);

        router.replace("/(tabs)");
      }
    };

    handleReloadRecovery();
  }, []);

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
      if (url.includes("pradesh-times://news/")) {
        const id = url.split("/news/")[1];
        // console.log("📰 Navigating to news detail with ID:", id);
        await AsyncStorage.setItem("highlighted_news_id", id);
        router.push("/(tabs)/news");
      }

      try {
        const parsed = Linking.parse(fixedUrl);
        // console.log("🧩 Parsed link printed ✅", parsed);

        const { access_token, type } = parsed.queryParams || {};
        const token = access_token as string | undefined;
        const flowType = type as string | undefined;
        const refresh_token = parsed.queryParams?.refresh_token as
          | string
          | undefined;

        if (token && refresh_token && flowType === "recovery") {
          await AsyncStorage.setItem("is_recovery_mode", "true");
          await AsyncStorage.setItem("token", token);
          await AsyncStorage.setItem("refresh_token", refresh_token);
        }
        setIsDeepLinkChecked(true);
      } catch (err) {
        console.log("❌ Error while parsing link:", err);
      }
    };

    // ✅ Listen for links when app is running
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("📩 Deep link received while running:", event.url);
      handleDeepLink(event.url);
    });

    // ✅ Handle link when app opens first time
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("🚀 App opened via deep link:", initialUrl);
        await handleDeepLink(initialUrl);
      } else {
        console.log("🕵️‍♂️ No initial URL found (normal app start).");
        setIsDeepLinkChecked(true);
      }
    })();

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

// ✅ Yeh hi default export hai
export default function RootLayout() {
  return (
    <DeepLinkProvider>
      <AppContent />
    </DeepLinkProvider>
  );
}
