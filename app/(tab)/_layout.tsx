import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#1E325D",
          borderRadius: 30,
          height: 70,
          paddingTop: 10,
          boxShadow: "none",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={focused ? "#ffd900" : "#ffd900"}
            />
          ),
        }}
      />
      <Tabs.Screen name="news"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }} />
      <Tabs.Screen name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }} />
      {/* <Tabs.Screen name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}


              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }} /> */}
      <Tabs.Screen name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#ffffffff"}
            />
          ),
        }} />
    </Tabs>
  );
}
