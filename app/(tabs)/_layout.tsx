import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Platform, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
export default function TabLayout() {
  const { role } = useAuth();
  useEffect(() => {
    const handlePendingDeepLink = async () => {
      const id = await AsyncStorage.getItem("highlighted_news_id");
      if (id) {
        console.log("🟢 Tabs ready, navigating to /news:", id);

        // navigate to news tab
        router.push("/news");

        // optional: clear once used
        await AsyncStorage.removeItem("highlighted_news_id");
      }
    };

    handlePendingDeepLink();
  }, []);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#C62828", // ✅ Red for active
        tabBarInactiveTintColor: "#999", // ✅ Gray for inactive

        // ✅ MERGED SINGLE tabBarStyle
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          position: "absolute",

          // ✅ Hide tabs on upload screen
          display: route.name === "pdfPreview" ? "none" : "flex",
        },

        tabBarItemStyle: {
          paddingVertical: 5,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        headerShown: false,
      })}
    >
      {/* Tab 1: Home */}
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

      {/* Tab 2: News */}
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
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

      {/* Tab 3: E-Paper */}
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
              {/* ✅ Admin badge - context se role */}
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
    height: 35,
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
