import { router, Stack } from "expo-router";
import AuthProvider from "../app/providers/AuthProvider";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ add this

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const path = usePathname();

  // ✅ Just for debug
  useEffect(() => {
    const scheme = Linking.createURL("");
    const full = `${scheme.replace(/\/$/, "")}${path}`;
    console.log("🛣️ Current full URL:", full);
  }, [path]);

  useEffect(() => {
    const testDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log("🔗 Initial URL raw:", initialUrl);

      if (!initialUrl) {
        console.log("🟡 App opened normally (no deep link)");
        setIsReady(true);
        return;
      }

      let fixedUrl = initialUrl;

      // ✅ Remove exp+ if present (Expo dev build prefix)
      if (initialUrl.startsWith("exp+pradesh-times://")) {
        fixedUrl = initialUrl.replace("exp+", "");
      }

      // ✅ Replace # with ? for proper parsing
      if (fixedUrl.includes("#")) {
        const [base, hash] = fixedUrl.split("#");
        fixedUrl = `${base}?${hash}`;
      }

      const parsed = Linking.parse(fixedUrl);
      console.log("📍 Parsed URL:", JSON.stringify(parsed, null, 2));

      const path = parsed.path || "(none)";
      const query = parsed.queryParams || {};
      const rawToken = query.token || query.access_token || "(no token)";
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

      const type = query.type || "(no type)";

      console.log("✅ Extracted values:", { path, token, type });

      // ✅ Save token for ResetPasswordScreen
      if (path === "reset-password" && token && token !== "(no token)") {
        console.log("💾 Saving token to AsyncStorage...");
        await AsyncStorage.setItem("reset_token", token);
        console.log("✅ Token saved successfully.");

        console.log("🔑 Navigating to reset-password screen...");
        router.replace({
          pathname: "/reset-password",
          params: { type },
        });
      }
      setIsReady(true);
    };

    testDeepLink();
  }, []);

  if (!isReady) return null;

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
