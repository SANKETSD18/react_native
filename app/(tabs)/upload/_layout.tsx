import { Stack } from "expo-router";

export default function NewsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[file]" />
    </Stack>
  );
}
