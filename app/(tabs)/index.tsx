import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // NEW
  // console.log("hello");

  useEffect(() => {
    // Load existing session user
    console.clear()
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
          //  console.log('mount getUser uid:', data.user?.id);

      if (user) {
        setSessionEmail(user.email ?? null);
        fetchRole(user.id).catch(() => { });
      }
    }); 
    // Listen to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // console.log('Auth event:', event);
      const user = session?.user ?? null;
      setSessionEmail(user?.email ?? null);
      if (user?.id) fetchRole(user.id).catch(() => setRole(null));
      else setRole(null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const fetchRole = async (uid: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .maybeSingle();
  if (error) return Alert.alert('Role error', error.message); // step 2
  // Alert.alert('Role', data?.role ?? 'guest'); // step 3
  setRole(data?.role ?? 'guest');
};


  const signUp = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email & password');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return Alert.alert('Sign up failed', error.message);
    Alert.alert('Success', 'Verification link sent. Please confirm email, then log in.');
  };

  const signIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email & password');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert('Login failed', error.message);
    if (data.user?.id) fetchRole(data.user.id).catch(() => { });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setRole(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Supabase Auth</Text>

      {sessionEmail ? (
        <>
          <Text style={styles.subtitle}>Logged in as: {sessionEmail}</Text>
          <Text style={styles.subtitle}>Role: {role ?? 'guest'}</Text>
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
  input: { height: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  secondary: { backgroundColor: '#0ea5e9' },
  danger: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
