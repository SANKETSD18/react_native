import { Stack } from "expo-router";
import AuthProvider from "../app/providers/AuthProvider";





export default function RootLayout() {
  return (
    <AuthProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </AuthProvider>
  );
}
