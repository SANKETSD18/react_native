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
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height: 70,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
          position: "absolute",
        },
      }}
    >
      {/* Home Screen */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={focused ? "#ffd900" : "#888"}
            />
          ),
        }}
      />

      {/* News Screen */}
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }}
      />

      {/* PDF Screen */}
      <Tabs.Screen
        name="paper"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }}
      />

      {/* Upload Screen */}
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "cloud-upload" : "cloud-upload-outline"}
              size={28}
              color={focused ? "#FFEB3B" : "#888"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
