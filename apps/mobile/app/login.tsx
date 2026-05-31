import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { FS } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';
import { useServerStore } from '../stores/serverStore';
import { api } from '../lib/api';
import { sync } from '../lib/sync';

type Mode = 'local' | 'server';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('local');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('http://192.168.1.1:3001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginLocal, loginWithServer } = useAuthStore();
  const { setServer } = useServerStore();

  const handleLocalLogin = () => {
    if (!name.trim()) { setError('Enter your name.'); return; }
    loginLocal(name.trim());
  };

  const handleServerLogin = async () => {
    if (!serverUrl.trim()) { setError('Enter your server URL.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      // Point the API instance at the new server URL
      const cleanUrl = serverUrl.trim().replace(/\/$/, '');
      setServer(cleanUrl, ''); // temporarily set URL so api interceptors work
      // Override base URL for this login call
      const { data } = await api.post(
        `${cleanUrl}/api/auth/login`,
        { email: email.trim(), password }
      );
      setServer(cleanUrl, data.accessToken);
      await loginWithServer(email.trim(), password);
      // Pull server data into local SQLite
      sync();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not connect to server.';
      setError(msg);
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
          <Text style={styles.sub}>Personal health & fitness tracker</Text>
        </View>

        {/* Mode switcher */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => { setMode('local'); setError(''); }}
            style={[styles.modeBtn, mode === 'local' && styles.modeBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnLabel, mode === 'local' && styles.modeBtnLabelActive]}>
              Local (No server)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode('server'); setError(''); }}
            style={[styles.modeBtn, mode === 'server' && styles.modeBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnLabel, mode === 'server' && styles.modeBtnLabelActive]}>
              My Server
            </Text>
          </TouchableOpacity>
        </View>

        {/* Local mode */}
        {mode === 'local' && (
          <View style={styles.fields}>
            <Text style={styles.hint}>
              Data stays on this device. You can connect to a server later in Settings.
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={FS.muted}
              autoCapitalize="words"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={handleLocalLogin} activeOpacity={0.8}>
              <Text style={styles.btnLabel}>Continue Locally</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Server mode */}
        {mode === 'server' && (
          <View style={styles.fields}>
            <Text style={styles.hint}>
              Connect to your self-hosted FitSelf server for sync across devices.
            </Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="Server URL (e.g. http://192.168.1.10:3001)"
              placeholderTextColor={FS.muted}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={FS.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={FS.muted}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleServerLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnLabel}>Sign In to Server</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    maxWidth: 380,
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
    fontSize: 13,
    color: FS.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: FS.surface,
    borderRadius: FS.radius.md,
    padding: 3,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: FS.radius.sm,
  },
  modeBtnActive: {
    backgroundColor: FS.primary,
  },
  modeBtnLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: FS.muted,
  },
  modeBtnLabelActive: {
    color: '#fff',
  },
  fields: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: FS.muted,
    lineHeight: 19,
    marginBottom: 4,
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
  },
  btn: {
    backgroundColor: FS.primary,
    borderRadius: FS.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
