import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { supabase } from "@/supabaseClient";

export default function Index() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      console.log("Registering user:", { name, email });
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        console.log("SignUp Error:", authError);
        throw authError;
      }
      if (!authData.user) throw new Error("User not created");

      console.log("User signed up:", authData.user);

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        name,
        email,
      });

      if (profileError) {
        console.log("Profile Insert Error:", profileError);
        Alert.alert("Profile Insert Failed", profileError.message);
        throw profileError;
      }

      console.log("Profile inserted successfully");

      Alert.alert("Success", "Account created successfully! Please verify your email.");
      setIsRegister(false);
    } catch (err: any) {
      console.log("Register Failed:", err.message);
      Alert.alert("Register Failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      console.log("Logging in user:", email);
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        console.log("Login Error:", authError);
        throw authError;
      }
      console.log("User logged in:", authData.user);

      if (!authData.user.email_confirmed_at) {
        Alert.alert(
          "Email not verified",
          "Please verify your email by clicking the link sent to you."
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,name")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.log("Profile fetch error:", profileError);
        throw new Error("Profile not found");
      }

      console.log("Profile data:", profile);

      setUserName(profile.name || email);
      setIsLoggedIn(true);
      console.log("Login successful, isLoggedIn:", true);

      if (profile.role === "admin") {
        router.push({ pathname: "/upload", params: { user: email } });
      } else {
        router.push({ pathname: "/pdfList", params: { user: email } });
      }
    } catch (err: any) {
      console.log("Login Failed:", err.message);
      Alert.alert("Login Failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("Logout pressed");
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserName("");
    setEmail("");
    setPassword("");
    setIsRegister(false);
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoggedIn ? (
        <>
          <Text style={styles.title}>Welcome, {userName}</Text>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>{isRegister ? "Register" : "Login"}</Text>

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Enter Name"
              value={name}
              onChangeText={setName}
            />
          )}

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
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggleText}>
              {isRegister
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 18 },
  toggleText: { marginTop: 15, textAlign: "center", color: "#007bff" },
});
