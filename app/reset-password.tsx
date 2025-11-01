import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const backAction = () => {
      handleCancel();
      return true; // Prevent default back
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      console.log(
        "🔑 Starting password recovery process reset-password handle password"
      );

      try {
        // Step 1: Get token
        const storedToken = await AsyncStorage.getItem("reset_token");
        const authEvent = await AsyncStorage.getItem("auth_event");

        // ⚠️ Prevent infinite loop
        if (authEvent === "PASSWORD_RECOVERY") {
          console.log(
            "🌀 Already in PASSWORD_RECOVERY mode, skipping redirect..."
          );
          return;
        }

        if (!storedToken) {
          console.log("⚠️ No token found in storage.");
          return;
        }

        console.log("🔑 Setting recovery session with token:", storedToken);
        await AsyncStorage.setItem("auth_event", "PASSWORD_RECOVERY");
        console.log("💾 PASSWORD_RECOVERY mode activated ✅");

        // ✅ Redirect only once
        router.replace("/reset-password");

        // Optional: Fetch user email
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.email) {
          setEmail(userData.user.email);
          console.log("📧 User email:", userData.user.email);
        } else {
          console.log("⚠️ No user email found after session creation.");
        }
      } catch (err) {
        console.error("❌ Password recovery error:", err);
      }
    };

    handlePasswordRecovery();
  }, []);

  // ✅ Cancel handler - properly sign out
  const handleCancel = () => {
    Alert.alert(
      "Cancel Password Reset?",
      "Your password will not be changed and you will be logged out.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Cancel & Logout",
          style: "destructive",
          onPress: async () => {
            console.log("🚪 Logging out...");
            await supabase.auth.signOut(); // ✅ Small delay to ensure logout completes
            setTimeout(() => {
              router.replace("/(tabs)"); // Or your login route
            }, 200);
          },
        },
      ]
    );
  };

  const handleUpdatePassword = async () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    console.log("🔐 Password update initiated");
    // console.log("click"); // ✅ Validation

    if (!trimmedNewPassword || !trimmedConfirm) {
      return Alert.alert("Error", "Please fill all fields");
    }

    if (trimmedNewPassword !== trimmedConfirm) {
      return Alert.alert("Password Mismatch", "Passwords do not match");
    }

    if (trimmedNewPassword.length < 6) {
      return Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long"
      );
    }

    setLoading(true);

    try {
      // ✅ Add timeout for API call (10 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout - check your internet")),
          10000
        )
      ); // ✅ Check session first

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("🔑 Session exists:", !!session);
      console.log("👤 Session user:", session?.user?.email);

      if (!session) {
        setLoading(false);
        return Alert.alert(
          "Session Expired",
          "Your reset link has expired. Please request a new one.",
          [
            {
              text: "OK",
              onPress: async () => {
                await supabase.auth.signOut();
                router.replace("/forgot-password");
              },
            },
          ]
        );
      } // ✅ Update password with timeout

      console.log("🔄 Updating password...");

      const updatePromise = supabase.auth.updateUser({
        password: trimmedNewPassword,
      });

      const { data, error } = (await Promise.race([
        updatePromise,
        timeoutPromise,
      ])) as any;

      console.log("✅ Update complete");
      console.log("Response:", data);
      console.log("Error:", error);

      setLoading(false);

      if (error) {
        console.error("❌ Update error:", error);
        return Alert.alert(
          "Update Failed",
          error.message || "Failed to update password"
        );
      } // ✅ Success - Sign out and redirect to login

      console.log("🎉 Password updated successfully!");
      await AsyncStorage.removeItem("auth_event");
      await AsyncStorage.removeItem("reset_token");
      console.log("🧹 Cleared PASSWORD_RECOVERY data after reset ✅");

      Alert.alert(
        "Success! 🎉",
        "Your password has been reset successfully. Please login with your new password.",
        [
          {
            text: "Login Now",
            onPress: async () => {
              await supabase.auth.signOut();
              setTimeout(() => {
                router.replace("/(tabs)"); // Your login route
              }, 200);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("❌ Catch error:", err);
      setLoading(false);

      if (err.message.includes("timeout")) {
        Alert.alert(
          "Network Error",
          "Request timed out. Please check your internet connection and try again."
        );
      } else {
        Alert.alert("Error", err.message || "Something went wrong");
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Reset Password",
          headerStyle: { backgroundColor: "#C62828" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          gestureEnabled: false,
        }}
      />

      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar backgroundColor="#C62828" barStyle="light-content" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={80} color="#C62828" />
          </View>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Enter a new password for your account
          </Text>

          {email && (
            <View style={styles.emailBox}>
              <Ionicons name="mail" size={16} color="#666" />
              <Text style={styles.emailText}>{email}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
            </View>

            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#999"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>Password must:</Text>

            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />

              <Text style={styles.requirementText}>
                Be at least 6 characters long
              </Text>
            </View>

            <View style={styles.requirement}>
              <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />

              <Text style={styles.requirementText}>Match in both fields</Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={loading || !newPassword || !confirmPassword}
            style={[
              styles.submitButton,
              (loading || !newPassword || !confirmPassword) &&
                styles.buttonDisabled,
            ]}
            onPress={handleUpdatePassword}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>Updating...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />

                <Text style={styles.submitButtonText}>Reset Password</Text>
              </>
            )}
          </TouchableOpacity>

          {loading && (
            <Text style={styles.waitText}>
              Please wait, this may take a few seconds...
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "#ffebee",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  emailText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    elevation: 1,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: "#333",
  },
  passwordToggle: {
    padding: 8,
  },
  requirementsBox: {
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 8,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: "#388e3c",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    padding: 16,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  waitText: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginTop: 12,
    fontStyle: "italic",
  },
});
