import * as Linking from "expo-linking";
import { router, Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import AuthProvider from "../app/providers/AuthProvider";
import { DeepLinkProvider, useDeepLink } from "../context/DeepLinkContext";
import AsyncStorage from "@react-native-async-storage/async-storage";


function AppContent() {
  const path = usePathname();
  const { setIsDeepLinkChecked, setIsRecoveryMode } = useDeepLink();

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
        // console.log("🧩 Parsed link printed ✅", parsed);

        const { access_token, type } = parsed.queryParams || {};
        const token = access_token as string | undefined;
        const flowType = type as string | undefined;
        const refresh_token = parsed.queryParams?.refresh_token as
          | string
          | undefined;

        if (token && refresh_token && flowType === "recovery") {
          
          await AsyncStorage.setItem("is_recovery_mode", "true");
          
          setIsRecoveryMode(true);



          console.log("🔑 token and refesh token", token, refresh_token);


          const resetUrl = `/reset-password?access_token=${encodeURIComponent(
            token
          )}&refresh_token=${encodeURIComponent(refresh_token)}&type=recovery`;

          router.replace(resetUrl as `/reset-password?${string}`);
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
