import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { FS } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const [email, setEmail]   = useState('alex@home.local');
  const [pw, setPw]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim()) { setError('Enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), pw);
    } catch {
      setError('Invalid credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Wordmark */}
        <View style={styles.brand}>
          <Text style={styles.wordmark}>FitSelf</Text>
          <Text style={styles.sub}>Sign in to continue</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={FS.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            value={pw}
            onChangeText={setPw}
            placeholder="Password"
            placeholderTextColor={FS.muted}
            secureTextEntry
            autoComplete="current-password"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnLabel}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Don't have an account?{'  '}
          <Text style={styles.link}>Register</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: '700',
    color: FS.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    color: FS.muted,
    marginTop: 8,
  },
  fields: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: FS.surface,
    borderWidth: 1,
    borderColor: FS.border,
    borderRadius: FS.radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14,
    color: FS.text,
  },
  error: {
    fontSize: 13,
    color: FS.danger,
    textAlign: 'center',
    marginBottom: 10,
  },
  btn: {
    backgroundColor: FS.primary,
    borderRadius: FS.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: FS.muted,
  },
  link: {
    color: FS.primary,
    fontWeight: '500',
  },
});
