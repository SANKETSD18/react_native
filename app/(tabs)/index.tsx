import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
  View,
} from "react-native";
import { supabase } from "@/supabaseClient";

type ErrorLike = { message?: string };

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const [allUsers, setAllUsers] = useState<any[]>([]); // Admin ke liye users list

  const formatErrorMessage = (err: unknown): string => {
    let errorMessage = "An error occurred";
    if (typeof err === "string") errorMessage = err;
    else if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as ErrorLike).message === "string"
    )
      errorMessage = (err as ErrorLike).message!;
    else {
      try {
        errorMessage = JSON.stringify(err);
      } catch { }
    }
    return errorMessage;
  };

  // Login
 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter email and password");
    return;
  }
  setLoading(true);

  try {
    // Supabase sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;

    // Profile check or create
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile && profileError && profileError.code === 'PGRST116') {
      // Profile not found, create profile with default role 'user'
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: "user",
      });
      if (insertError) throw insertError;
    }

    // Re-fetch profile to get role
    const { data: refreshedProfile, error: refreshedError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (refreshedError) throw refreshedError;

    setUserRole(refreshedProfile.role || "user");
    setUserName(email.split("@")[0]);
    setIsLoggedIn(true);
  } catch (err) {
    Alert.alert("Login Failed", formatErrorMessage(err));
  } finally {
    setLoading(false);
  }
};


  // Fetch all users (only admin)
  const fetchAllUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("id,email,role");
    if (error) Alert.alert("Error", "Failed to fetch users");
    else setAllUsers(data || []);
  };

  // Update user role (admin feature)
  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", `User role updated to ${newRole}`);
      fetchAllUsers(); // Refresh list
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
    setEmail("");
    setPassword("");
    setAllUsers([]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Please wait..." : "Login"}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome, {userName}
      </Text>
      <Text style={styles.welcomeText}>Role: {userRole}</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Admin Panel */}
      {userRole === "admin" && (
        <>
          <Text style={styles.sectionTitle}>Admin Panel - Manage User Roles</Text>
          <FlatList
            data={allUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <Text>{item.email}</Text>
                <Text style={styles.roleText}>{item.role}</Text>
                {item.role !== "admin" ? (
                  <TouchableOpacity
                    style={styles.makeAdminBtn}
                    onPress={() => updateUserRole(item.id, "admin")}
                  >
                    <Text style={styles.buttonTextSmall}>Make Admin</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.removeAdminBtn}
                    onPress={() => updateUserRole(item.id, "user")}
                  >
                    <Text style={styles.buttonTextSmall}>Remove Admin</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    height: 50,
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 7,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 18 },
  welcomeText: { fontSize: 22, marginBottom: 10, textAlign: "center" },
  logoutButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 7,
    marginBottom: 30,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, marginTop: 10 },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  roleText: { fontWeight: "bold" },
  makeAdminBtn: {
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: "center",
  },
  removeAdminBtn: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: "center",
  },
  buttonTextSmall: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
