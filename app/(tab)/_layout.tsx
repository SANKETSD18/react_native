import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
   <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#000",
          borderRadius: 30,
          height: 70,
          paddingHorizontal: 10,
        },
      }}
    >
     <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={focused ? "#fff" : "#888"}
            />
          ),
        }}
      />
      <Tabs.Screen name="about"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "information-circle" : "information-circle-outline"}
              size={28}
              color={focused ? "#fff" : "#888"}
            />
          ),
        }} />
      <Tabs.Screen name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={28}
              color={focused ? "#fff" : "#888"}
            />
          ),
        }} />
      <Tabs.Screen name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={28}
              color={focused ? "#fff" : "#888"}
            />
          ),
        }} />
      <Tabs.Screen name="news"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={28}
              color={focused ? "#fff" : "#888"}
            />
          ),
        }} />
    </Tabs>
  );
}
