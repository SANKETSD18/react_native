import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    // Load existing session user
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) setSessionEmail(data.user.email ?? null);
    });
    // Listen to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signUp = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email & password');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sign up failed', error.message);
    else Alert.alert('Success', 'Check email to confirm (if enabled)');
    setLoading(false);
  };

  const signIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email & password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login failed', error.message);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Supabase Auth</Text>

      {sessionEmail ? (
        <>
          <Text style={styles.subtitle}>Logged in as: {sessionEmail}</Text>
          <TouchableOpacity style={[styles.button, styles.danger]} onPress={signOut}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity disabled={loading} style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Login'}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={loading} style={[styles.button, styles.secondary]} onPress={signUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f7f7f7' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 12 },
  input: {
    height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  secondary: { backgroundColor: '#0ea5e9' },
  danger: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
