import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tab)" options={{ headerShown: false }} />
    </Stack>
  );
}
