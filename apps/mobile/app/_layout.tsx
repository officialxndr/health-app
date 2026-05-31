import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDb } from '../lib/db';
import { sync } from '../lib/sync';
import { useAuthStore } from '../stores/authStore';

function AuthGuard() {
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabs = segments[0] === '(tabs)';
    const inSession = segments[0] === 'session';
    if (!user && inTabs) {
      router.replace('/login');
    } else if (user && !inTabs && !inSession) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // Initialise SQLite schema (synchronous, runs once)
    try { initDb(); } catch (e) { console.error('DB init failed', e); }
    // Initial sync if server is configured
    sync();
  }, []);

  useEffect(() => {
    // Re-sync whenever app comes to the foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="session"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
