// import { useEffect, useState } from "react";
// import {
//   Alert,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StatusBar,
//   ActivityIndicator,
// } from "react-native";
// import { supabase } from "../../lib/supabaseClient";
// import { useAuth } from "../providers/AuthProvider"; // ✅ Context se role
// import Ionicons from "@expo/vector-icons/Ionicons";

// export default function AuthScreen() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [authMode, setAuthMode] = useState<"login" | "signup">("login");

//   // ✅ Context se user and role
//   const { user, role } = useAuth();
//   const sessionEmail = user?.email ?? null;

//   // ✅ Sign Up
//   const signUp = async () => {
//     const trimmedEmail = email.trim().toLowerCase();
//     const trimmedPassword = password.trim();
//     const trimmedConfirm = confirmPassword.trim();

//     // Validations...
//     if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
//       return Alert.alert("Error", "All fields are required");
//     }

//     if (trimmedPassword !== trimmedConfirm) {
//       return Alert.alert("Password Mismatch", "Passwords do not match");
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(trimmedEmail)) {
//       return Alert.alert("Invalid Email", "Please enter a valid email address");
//     }

//     if (trimmedPassword.length < 6) {
//       return Alert.alert(
//         "Weak Password",
//         "Password must be at least 6 characters long"
//       );
//     }

//     setLoading(true);

//     try {
//       // ✅ NO email check - direct signup
//       const { data, error } = await supabase.auth.signUp({
//         email: trimmedEmail,
//         password: trimmedPassword,
//       });

//       setLoading(false);

//       // ✅ Supabase will return specific error if email exists
//       if (error) {
//         console.log("Signup error:", error);

//         // Handle duplicate email error
//         if (
//           error.message.includes("already") ||
//           error.message.includes("registered") ||
//           error.status === 422 ||
//           error.status === 400
//         ) {
//           return Alert.alert(
//             "Account Already Exists",
//             "This email is already registered. Please sign in instead.",
//             [
//               {
//                 text: "Go to Login",
//                 onPress: () => {
//                   setAuthMode("login");
//                   setPassword("");
//                   setConfirmPassword("");
//                 },
//               },
//             ]
//           );
//         }

//         return Alert.alert("Sign up failed", error.message);
//       }

//       // Success handling...
//       if (data.user && !data.session) {
//         Alert.alert(
//           "Success! 🎉",
//           "Verification link sent to your email. Please confirm your email, then log in.",
//           [
//             {
//               text: "Go to Login",
//               onPress: () => {
//                 setAuthMode("login");
//                 setEmail("");
//                 setPassword("");
//                 setConfirmPassword("");
//               },
//             },
//           ]
//         );
//       } else if (data.session) {
//         Alert.alert("Success! 🎉", "Account created successfully!");
//       }
//     } catch (err: any) {
//       setLoading(false);
//       Alert.alert("Error", err.message || "Something went wrong");
//     }
//   };

//   // ✅ log in
//   const signIn = async () => {
//     const trimmedEmail = email.trim().toLowerCase();
//     const trimmedPassword = password.trim();

//     if (!trimmedEmail || !trimmedPassword) {
//       return Alert.alert("Error", "Email and password cannot be empty");
//     }

//     setLoading(true);

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: trimmedEmail,
//       password: trimmedPassword,
//     });

//     setLoading(false);

//     if (error) {
//       if (error.message.includes("Invalid login credentials")) {
//         return Alert.alert(
//           "Login Failed",
//           "Invalid email or password. Please try again."
//         );
//       }
//       if (error.message.includes("Email not confirmed")) {
//         return Alert.alert(
//           "Email Not Verified",
//           "Please check your email and verify your account first."
//         );
//       }
//       return Alert.alert("Login failed", error.message);
//     }

//     // ✅ Context automatically updates role, no need to fetch manually
//     console.log("User logged in:", data.user?.email);
//   };

//   // ✅ Sign Out
//   const signOut = async () => {
//     await supabase.auth.signOut();
//     setEmail("");
//     setPassword("");
//     setConfirmPassword("");
//   };

//   // ✅ Switch between Login and Sign Up (Clear fields)
//   const switchAuthMode = () => {
//     const newMode = authMode === "login" ? "signup" : "login";
//     setAuthMode(newMode);
//     setEmail("");
//     setPassword("");
//     setConfirmPassword("");
//     setShowPassword(false);
//     setShowConfirmPassword(false);
//   };

//   // ✅ Logged In View
//   if (sessionEmail) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar backgroundColor="#C62828" barStyle="light-content" />

//         <View style={styles.loggedInContainer}>
//           {/* Header */}
//           <View style={styles.loggedInHeader}>
//             <View style={styles.avatarContainer}>
//               <Ionicons name="person" size={40} color="#C62828" />
//             </View>
//             <Text style={styles.welcomeText}>Welcome Back!</Text>
//             <Text style={styles.emailText}>{sessionEmail}</Text>
//           </View>

//           {/* Role Card */}
//           <View style={styles.roleCard}>
//             <View style={styles.roleIconContainer}>
//               <Ionicons
//                 name={role === "admin" ? "shield-checkmark" : "person-circle"}
//                 size={32}
//                 color={role === "admin" ? "#2e7d32" : "#1976d2"}
//               />
//             </View>
//             <View style={styles.roleInfo}>
//               <Text style={styles.roleLabel}>Your Role</Text>
//               <Text
//                 style={[
//                   styles.roleValue,
//                   { color: role === "admin" ? "#2e7d32" : "#1976d2" },
//                 ]}
//               >
//                 {role === "admin" ? "👑 Admin" : "👤 Guest"}
//               </Text>
//             </View>
//           </View>

//           {/* Features */}
//           <View style={styles.featuresCard}>
//             <Text style={styles.featuresTitle}>Access Features</Text>
//             <View style={styles.featureItem}>
//               <Ionicons name="newspaper-outline" size={20} color="#666" />
//               <Text style={styles.featureText}>Read Latest News</Text>
//               <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
//             </View>
//             <View style={styles.featureItem}>
//               <Ionicons name="document-text-outline" size={20} color="#666" />
//               <Text style={styles.featureText}>View E-Papers</Text>
//               <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
//             </View>
//             {role === "admin" && (
//               <>
//                 <View style={styles.featureItem}>
//                   <Ionicons name="create-outline" size={20} color="#666" />
//                   <Text style={styles.featureText}>Manage News</Text>
//                   <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
//                 </View>
//                 <View style={styles.featureItem}>
//                   <Ionicons
//                     name="cloud-upload-outline"
//                     size={20}
//                     color="#666"
//                   />
//                   <Text style={styles.featureText}>Upload PDFs</Text>
//                   <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
//                 </View>
//               </>
//             )}
//           </View>

//           {/* Logout Button */}
//           <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
//             <Ionicons name="log-out-outline" size={20} color="#fff" />
//             <Text style={styles.logoutButtonText}>Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ✅ Login/Sign Up View
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#C62828" barStyle="light-content" />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardView}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.logoContainer}>
//               <Ionicons name="newspaper" size={60} color="#C62828" />
//             </View>
//             <Text style={styles.title}>PRADESH TIMES</Text>
//             <Text style={styles.subtitle}>Your Daily News Companion</Text>
//           </View>

//           {/* Tab Toggle */}
//           <View style={styles.tabContainer}>
//             <TouchableOpacity
//               style={[styles.tab, authMode === "login" && styles.tabActive]}
//               onPress={() => {
//                 setAuthMode("login");
//                 setEmail("");
//                 setPassword("");
//                 setConfirmPassword("");
//               }}
//             >
//               <Ionicons
//                 name="log-in-outline"
//                 size={20}
//                 color={authMode === "login" ? "#C62828" : "#999"}
//               />
//               <Text
//                 style={[
//                   styles.tabText,
//                   authMode === "login" && styles.tabTextActive,
//                 ]}
//               >
//                 Login
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.tab, authMode === "signup" && styles.tabActive]}
//               onPress={() => {
//                 setAuthMode("signup");
//                 setEmail("");
//                 setPassword("");
//                 setConfirmPassword("");
//               }}
//             >
//               <Ionicons
//                 name="person-add-outline"
//                 size={20}
//                 color={authMode === "signup" ? "#C62828" : "#999"}
//               />
//               <Text
//                 style={[
//                   styles.tabText,
//                   authMode === "signup" && styles.tabTextActive,
//                 ]}
//               >
//                 Sign Up
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Form Container */}
//           <View style={styles.formContainer}>
//             <Text style={styles.formTitle}>
//               {authMode === "login" ? "👋 Welcome Back!" : "🎉 Create Account"}
//             </Text>
//             <Text style={styles.formSubtitle}>
//               {authMode === "login"
//                 ? "Sign in to access your account"
//                 : "Join us to get latest news updates"}
//             </Text>

//             {/* Email Input */}
//             <View style={styles.inputContainer}>
//               <View style={styles.inputIconContainer}>
//                 <Ionicons name="mail-outline" size={20} color="#999" />
//               </View>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your email"
//                 placeholderTextColor="#999"
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//                 value={email}
//                 onChangeText={setEmail}
//               />
//             </View>

//             {/* Password Input */}
//             <View style={styles.inputContainer}>
//               <View style={styles.inputIconContainer}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#999" />
//               </View>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your password"
//                 placeholderTextColor="#999"
//                 secureTextEntry={!showPassword}
//                 autoCapitalize="none"
//                 value={password}
//                 onChangeText={setPassword}
//               />
//               <TouchableOpacity
//                 style={styles.passwordToggle}
//                 onPress={() => setShowPassword(!showPassword)}
//               >
//                 <Ionicons
//                   name={showPassword ? "eye-off-outline" : "eye-outline"}
//                   size={20}
//                   color="#999"
//                 />
//               </TouchableOpacity>
//             </View>

//             {/* Confirm Password (Only for Sign Up) */}
//             {authMode === "signup" && (
//               <View style={styles.inputContainer}>
//                 <View style={styles.inputIconContainer}>
//                   <Ionicons name="lock-closed-outline" size={20} color="#999" />
//                 </View>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Confirm your password"
//                   placeholderTextColor="#999"
//                   secureTextEntry={!showConfirmPassword}
//                   autoCapitalize="none"
//                   value={confirmPassword}
//                   onChangeText={setConfirmPassword}
//                 />
//                 <TouchableOpacity
//                   style={styles.passwordToggle}
//                   onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 >
//                   <Ionicons
//                     name={
//                       showConfirmPassword ? "eye-off-outline" : "eye-outline"
//                     }
//                     size={20}
//                     color="#999"
//                   />
//                 </TouchableOpacity>
//               </View>
//             )}

//             {/* Submit Button */}
//             <TouchableOpacity
//               disabled={
//                 loading ||
//                 !email ||
//                 !password ||
//                 (authMode === "signup" && !confirmPassword)
//               }
//               style={[
//                 styles.submitButton,
//                 (loading ||
//                   !email ||
//                   !password ||
//                   (authMode === "signup" && !confirmPassword)) &&
//                   styles.buttonDisabled,
//               ]}
//               onPress={authMode === "login" ? signIn : signUp}
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <>
//                   <Ionicons
//                     name={
//                       authMode === "login"
//                         ? "log-in-outline"
//                         : "person-add-outline"
//                     }
//                     size={20}
//                     color="#fff"
//                   />
//                   <Text style={styles.submitButtonText}>
//                     {authMode === "login" ? "Login" : "Create Account"}
//                   </Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             {/* Switch Auth Mode Link */}
//             <View style={styles.switchContainer}>
//               <Text style={styles.switchText}>
//                 {authMode === "login"
//                   ? "Don't have an account?"
//                   : "Already have an account?"}
//               </Text>
//               <TouchableOpacity onPress={switchAuthMode}>
//                 <Text style={styles.switchLink}>
//                   {authMode === "login" ? "Sign Up" : "Login"}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Info Card */}
//           <View style={styles.infoCard}>
//             <Ionicons
//               name="information-circle-outline"
//               size={20}
//               color="#1976d2"
//             />
//             <Text style={styles.infoText}>
//               {authMode === "login"
//                 ? "Enter your credentials to access exclusive content"
//                 : "Create an account to access exclusive news and e-papers"}
//             </Text>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//     padding: 20,
//     justifyContent: "center",
//   },

//   // Header
//   header: {
//     alignItems: "center",
//     marginBottom: 30,
//   },
//   logoContainer: {
//     width: 100,
//     height: 100,
//     backgroundColor: "#ffebee",
//     borderRadius: 50,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#C62828",
//     marginBottom: 8,
//     letterSpacing: 1,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666",
//     fontWeight: "500",
//   },

//   // Tab Container
//   tabContainer: {
//     flexDirection: "row",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 4,
//     marginBottom: 20,
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   tab: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   tabActive: {
//     backgroundColor: "#ffebee",
//   },
//   tabText: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#999",
//   },
//   tabTextActive: {
//     color: "#C62828",
//   },

//   // Form
//   formContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 20,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginBottom: 20,
//   },
//   formTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#333",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   formSubtitle: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f9f9f9",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     borderRadius: 10,
//     marginBottom: 16,
//     paddingHorizontal: 12,
//   },
//   inputIconContainer: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     fontSize: 15,
//     color: "#333",
//   },
//   passwordToggle: {
//     padding: 8,
//   },

//   // Submit Button
//   submitButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#C62828",
//     padding: 16,
//     borderRadius: 10,
//     gap: 8,
//     marginTop: 8,
//   },
//   submitButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },

//   // Switch Auth Mode
//   switchContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 20,
//     gap: 6,
//   },
//   switchText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   switchLink: {
//     fontSize: 14,
//     color: "#C62828",
//     fontWeight: "700",
//   },

//   // Info Card
//   infoCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#e3f2fd",
//     padding: 16,
//     borderRadius: 10,
//     gap: 12,
//   },
//   infoText: {
//     flex: 1,
//     fontSize: 13,
//     color: "#1976d2",
//     lineHeight: 18,
//   },

//   // Logged In View
//   loggedInContainer: {
//     flex: 1,
//     padding: 20,
//   },
//   loggedInHeader: {
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 30,
//     marginBottom: 20,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   avatarContainer: {
//     width: 80,
//     height: 80,
//     backgroundColor: "#ffebee",
//     borderRadius: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 16,
//   },
//   welcomeText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 8,
//   },
//   emailText: {
//     fontSize: 14,
//     color: "#666",
//   },
//   roleCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 20,
//     elevation: 1,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   roleIconContainer: {
//     width: 56,
//     height: 56,
//     backgroundColor: "#f5f5f5",
//     borderRadius: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 16,
//   },
//   roleInfo: {
//     flex: 1,
//   },
//   roleLabel: {
//     fontSize: 14,
//     color: "#666",
//     marginBottom: 4,
//   },
//   roleValue: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   featuresCard: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 20,
//   },
//   featuresTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#333",
//     marginBottom: 16,
//   },
//   featureItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//     gap: 12,
//   },
//   featureText: {
//     flex: 1,
//     fontSize: 14,
//     color: "#555",
//   },
//   logoutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#d32f2f",
//     padding: 16,
//     borderRadius: 10,
//     gap: 8,
//   },
//   logoutButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });


import { useEffect, useState } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const { user, role } = useAuth();
  const sessionEmail = user?.email ?? null;

  // ✅ NEW: Password Reset Function
  const resetPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return Alert.alert('Error', 'Please enter your email address');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'yourapp://reset-password', // Optional: Deep link for mobile
      });

      setLoading(false);

      if (error) {
        console.log('Reset password error:', error);
        return Alert.alert('Error', error.message);
      }

      Alert.alert(
        'Check Your Email! 📧',
        'Password reset link has been sent to your email. The link will expire in 10 minutes.',
        [{ text: 'OK' }]
      );

      // Clear email field
      setEmail('');

    } catch (err: any) {
      setLoading(false);
      console.log('Reset password exception:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const signUp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      return Alert.alert('Error', 'All fields are required');
    }

    if (trimmedPassword !== trimmedConfirm) {
      return Alert.alert('Password Mismatch', 'Passwords do not match');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }

    if (trimmedPassword.length < 6) {
      return Alert.alert('Weak Password', 'Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: trimmedEmail, 
        password: trimmedPassword 
      });

      setLoading(false);

      if (error) {
        if (error.message.toLowerCase().includes('already') || 
            error.message.toLowerCase().includes('registered')) {
          return Alert.alert(
            'Account Already Exists', 
            'This email is already registered. Please sign in instead.',
            [
              { 
                text: 'Go to Login', 
                onPress: () => {
                  setAuthMode('login');
                  setPassword('');
                  setConfirmPassword('');
                }
              }
            ]
          );
        }
        
        return Alert.alert('Sign up failed', error.message);
      }

      if (!data.user) {
        return Alert.alert('Error', 'Failed to create account');
      }

      if (data.user && !data.session) {
        Alert.alert(
          'Success! 🎉', 
          'Verification link sent to your email. Please confirm your email (expires in 10 min), then log in.',
          [
            { 
              text: 'Go to Login', 
              onPress: () => {
                setAuthMode('login');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }
            }
          ]
        );
      } else if (data.session) {
        Alert.alert('Success! 🎉', 'Account created successfully!');
      }

    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const signIn = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return Alert.alert("Error", "Email and password cannot be empty");
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return Alert.alert(
          "Login Failed", 
          "Invalid email or password. Please try again."
        );
      }
      if (error.message.includes('Email not confirmed')) {
        return Alert.alert(
          "Email Not Verified", 
          "Please check your email and verify your account first."
        );
      }
      return Alert.alert("Login failed", error.message);
    }

    console.log("User logged in:", data.user?.email);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchAuthMode = () => {
    const newMode = authMode === 'login' ? 'signup' : 'login';
    setAuthMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Logged In View
  if (sessionEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#C62828" barStyle="light-content" />
        
        <View style={styles.loggedInContainer}>
          <View style={styles.loggedInHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#C62828" />
            </View>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.emailText}>{sessionEmail}</Text>
          </View>

          <View style={styles.roleCard}>
            <View style={styles.roleIconContainer}>
              <Ionicons 
                name={role === 'admin' ? 'shield-checkmark' : 'person-circle'} 
                size={32} 
                color={role === 'admin' ? '#2e7d32' : '#1976d2'} 
              />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Your Role</Text>
              <Text style={[
                styles.roleValue,
                { color: role === 'admin' ? '#2e7d32' : '#1976d2' }
              ]}>
                {role === 'admin' ? '👑 Admin' : '👤 Guest'}
              </Text>
            </View>
          </View>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Access Features</Text>
            <View style={styles.featureItem}>
              <Ionicons name="newspaper-outline" size={20} color="#666" />
              <Text style={styles.featureText}>Read Latest News</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <Text style={styles.featureText}>View E-Papers</Text>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
            </View>
            {role === 'admin' && (
              <>
                <View style={styles.featureItem}>
                  <Ionicons name="create-outline" size={20} color="#666" />
                  <Text style={styles.featureText}>Manage News</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#666" />
                  <Text style={styles.featureText}>Upload PDFs</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Login/Sign Up View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C62828" barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="newspaper" size={60} color="#C62828" />
            </View>
            <Text style={styles.title}>PRADESH TIMES</Text>
            <Text style={styles.subtitle}>Your Daily News Companion</Text>
          </View>

          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, authMode === 'login' && styles.tabActive]}
              onPress={() => {
                setAuthMode('login');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <Ionicons 
                name="log-in-outline" 
                size={20} 
                color={authMode === 'login' ? '#C62828' : '#999'} 
              />
              <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, authMode === 'signup' && styles.tabActive]}
              onPress={() => {
                setAuthMode('signup');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <Ionicons 
                name="person-add-outline" 
                size={20} 
                color={authMode === 'signup' ? '#C62828' : '#999'} 
              />
              <Text style={[styles.tabText, authMode === 'signup' && styles.tabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {authMode === 'login' ? '👋 Welcome Back!' : '🎉 Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {authMode === 'login' 
                ? 'Sign in to access your account' 
                : 'Join us to get latest news updates'
              }
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input (Only for Login and Sign Up) */}
            {(authMode === 'login' || authMode === 'signup') && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Confirm Password (Only for Sign Up) */}
            {authMode === 'signup' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ NEW: Forgot Password Link (Only in Login Mode) */}
            {authMode === 'login' && (
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              disabled={loading || !email || (authMode !== 'login' && (!password || !confirmPassword))}
              style={[
                styles.submitButton, 
                (loading || !email || (authMode !== 'login' && (!password || !confirmPassword))) && styles.buttonDisabled
              ]}
              onPress={authMode === 'login' ? signIn : signUp}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={authMode === 'login' ? "log-in-outline" : "person-add-outline"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.submitButtonText}>
                    {authMode === 'login' ? 'Login' : 'Create Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch Auth Mode Link */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={switchAuthMode}>
                <Text style={styles.switchLink}>
                  {authMode === 'login' ? 'Sign Up' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#1976d2" />
            <Text style={styles.infoText}>
              {authMode === 'login' 
                ? 'Enter your credentials to access exclusive content'
                : 'Create an account to access exclusive news and e-papers'
              }
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  
  // Header
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#ffebee",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  
  // Tab Container
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: "#ffebee",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#C62828",
  },

  // Form
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
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
  
  // ✅ NEW: Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    padding: 16,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Switch Auth Mode
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  switchText: {
    fontSize: 14,
    color: "#666",
  },
  switchLink: {
    fontSize: 14,
    color: "#C62828",
    fontWeight: "700",
  },
  
  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 10,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976d2",
    lineHeight: 18,
  },
  
  // Logged In View
  loggedInContainer: {
    flex: 1,
    padding: 20,
  },
  loggedInHeader: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#ffebee",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: "#666",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#f5f5f5",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  roleValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  featuresCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f",
    padding: 16,
    borderRadius: 10,
    gap: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
