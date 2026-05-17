import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Call bootstrap to ensure profiles/settings/themes are seeded
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        await fetch(`${apiUrl}/auth/bootstrap`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch {
      // Non-fatal — app can continue without bootstrap completing
    }

    // Auth state change will trigger the auth guard to redirect
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#1a1816]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-[#f0e8de] text-3xl font-semibold mb-1">Weekly Focus</Text>
        <Text className="text-[#6e635a] text-base mb-10">Sign in to continue</Text>

        <TextInput
          className="bg-[#25211e] text-[#f0e8de] rounded-xl px-4 py-4 mb-3 text-base"
          placeholder="Email"
          placeholderTextColor="#6e635a"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          className="bg-[#25211e] text-[#f0e8de] rounded-xl px-4 py-4 mb-6 text-base"
          placeholder="Password"
          placeholderTextColor="#6e635a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        {error && (
          <Text className="text-red-400 text-sm mb-4 text-center">{error}</Text>
        )}

        <TouchableOpacity
          className="bg-[#c87856] rounded-xl py-4 items-center"
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#f0e8de" />
          ) : (
            <Text className="text-[#f0e8de] text-base font-semibold">Sign in</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
