import { Stack } from "expo-router";
import AuthProvider from "../app/providers/AuthProvider";





export default function RootLayout() {
  return (
    <AuthProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
       <Stack.Screen 
          name="forgot-password" 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="reset-password" 
          options={{ headerShown: false }} 
        />
      
    </Stack>
    </AuthProvider>
  );
}
