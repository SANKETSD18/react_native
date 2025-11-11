import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";

export default function TabLayout() {
  const { role } = useAuth();

  return (
    <Tabs
      screenOptions={() => ({
        tabBarActiveTintColor: "#C62828",
        tabBarInactiveTintColor: "#999",
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 78,
          paddingTop: 10,
          paddingBottom: 8,
          borderTopWidth: 0, 
          
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },

        tabBarItemStyle: {
          paddingVertical: 5,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      })}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 📰 News */}
      <Tabs.Screen
        name="news/index"
        options={{
          title: "news",
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={focused ? "newspaper" : "newspaper-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      {/* 🚫 Hidden dynamic route for deep links */}
      <Tabs.Screen
        name="news/[id]"
        options={{
          href: null, // hides it from tab bar completely
        }}
      />

      {/* 📄 E-Paper */}
      <Tabs.Screen
        name="upload"
        options={{
          title: "E-Paper",
          tabBarIcon: ({ focused, color }) => (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconContainerActive,
              ]}
            >
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={24}
                color={color}
              />
              {role === "admin" && <View style={styles.adminDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    position: "relative",
  },
  iconContainerActive: {
    backgroundColor: "#ffebee",
  },
  adminDot: {
    position: "absolute",
    top: 2,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2e7d32",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});