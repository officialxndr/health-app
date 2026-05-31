import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  Modal, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../../components/ui/FSButton';
import { FSIcon } from '../../components/ui/FSIcon';
import { useAuthStore } from '../../stores/authStore';
import { useServerStore } from '../../stores/serverStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { api } from '../../lib/api';
import { sync } from '../../lib/sync';
import type { UnitSystem } from '../../types';

function Group({ header, children }: { header: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.groupHeader}>{header}</Text>
      <View style={s.groupCard}>{children}</View>
    </View>
  );
}

function Row({
  icon, label, onPress, right, first,
}: {
  icon: string; label: string; onPress?: () => void; right?: React.ReactNode; first?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.row, !first && s.rowBorder]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <FSIcon name={icon as any} size={20} color={FS.primary} />
      <Text style={s.rowLabel}>{label}</Text>
      {right ?? (onPress ? <FSIcon name="ChevronRight" size={16} color={FS.muted} /> : null)}
    </TouchableOpacity>
  );
}

// ── Server connect modal ──────────────────────────────────────────────────────
function ServerModal({ onClose }: { onClose: () => void }) {
  const { loginWithServer } = useAuthStore();
  const { setServer } = useServerStore();
  const [url, setUrl] = useState('http://192.168.1.1:3001');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!url.trim() || !email.trim()) { setError('Enter server URL and email.'); return; }
    setLoading(true);
    setError('');
    try {
      const cleanUrl = url.trim().replace(/\/$/, '');
      const { data } = await api.post(`${cleanUrl}/api/auth/login`, { email: email.trim(), password });
      setServer(cleanUrl, data.accessToken);
      sync(); // pull server data into SQLite
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={m.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={m.title}>Connect to Server</Text>
          <Text style={m.hint}>
            Enter your self-hosted FitSelf server address. Your data will sync automatically.
          </Text>
          <TextInput style={m.input} value={url} onChangeText={setUrl}
            placeholder="http://192.168.1.10:3001" placeholderTextColor={FS.muted}
            autoCapitalize="none" keyboardType="url" autoCorrect={false} />
          <TextInput style={m.input} value={email} onChangeText={setEmail}
            placeholder="Email" placeholderTextColor={FS.muted}
            autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={m.input} value={password} onChangeText={setPassword}
            placeholder="Password" placeholderTextColor={FS.muted} secureTextEntry />
          {error ? <Text style={m.error}>{error}</Text> : null}
          <View style={m.actions}>
            <FSButton variant="neutral" onPress={onClose} style={{ flex: 1 }}>Cancel</FSButton>
            <FSButton onPress={handleConnect} disabled={loading} style={{ flex: 1 }}>
              {loading ? <ActivityIndicator color="#fff" /> : 'Connect'}
            </FSButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Settings screen ───────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { serverUrl, clearServer } = useServerStore();
  const { unitSystem, setUnitSystem } = useSettingsStore();
  const [showServerModal, setShowServerModal] = useState(false);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <View style={s.profile}>
        <FSIcon name="UserCircle" size={52} strokeWidth={1.25} color={FS.muted} />
        <View>
          <Text style={s.profileName}>{user?.name ?? 'You'}</Text>
          {user?.email ? <Text style={s.profileEmail}>{user.email}</Text> : null}
        </View>
      </View>

      <Group header="Preferences">
        <Row first icon="Scale" label="Units" right={
          <View style={s.unitToggle}>
            {(['METRIC', 'IMPERIAL'] as UnitSystem[]).map((u) => (
              <TouchableOpacity key={u} onPress={() => setUnitSystem(u)}
                style={[s.unitOpt, unitSystem === u && s.unitOptActive]} activeOpacity={0.7}>
                <Text style={[s.unitLabel, unitSystem === u && s.unitLabelActive]}>
                  {u.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        } />
        <Row icon="Target" label="Goals" />
        <Row icon="Apple" label="Apple Health" />
      </Group>

      <Group header="Storage & Sync">
        {serverUrl ? (
          <>
            <Row first icon="Wifi" label="Connected to server" right={
              <View style={s.connectedBadge}>
                <Text style={s.connectedText}>Syncing</Text>
              </View>
            } />
            <Row icon="Server" label={serverUrl} right={null} />
            <Row icon="WifiOff" label="Disconnect server" onPress={() => clearServer()} />
          </>
        ) : (
          <>
            <Row first icon="HardDrive" label="Local storage" right={
              <View style={s.localBadge}>
                <Text style={s.localText}>On device</Text>
              </View>
            } />
            <Row icon="Server" label="Connect to server" onPress={() => setShowServerModal(true)} />
          </>
        )}
      </Group>

      <Group header="Tools">
        <Row first icon="Flame" label="TDEE Calculator" />
      </Group>

      <Group header="Account">
        <Row first icon="Bell" label="Notifications" />
        <Row icon="Shield" label="Privacy" />
        <Row icon="Info" label="About FitSelf" />
      </Group>

      <FSButton
        variant="neutral"
        full
        onPress={logout}
        textStyle={{ color: FS.danger }}
        style={s.signOut}
      >
        Sign Out
      </FSButton>

      {showServerModal && <ServerModal onClose={() => setShowServerModal(false)} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: FS.bg },
  content: { padding: 16, paddingBottom: 90, gap: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  profileName: { fontSize: 18, fontWeight: '700', color: FS.text },
  profileEmail: { fontSize: 13, color: FS.muted, marginTop: 2 },
  groupHeader: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, color: FS.muted, paddingHorizontal: 4, marginBottom: 8 },
  groupCard: { backgroundColor: FS.surface, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: FS.border },
  rowLabel: { flex: 1, fontSize: 14, color: FS.text },
  unitToggle: { flexDirection: 'row', backgroundColor: FS.surfaceHigh, borderRadius: 8, padding: 2 },
  unitOpt: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  unitOptActive: { backgroundColor: FS.primary },
  unitLabel: { fontSize: 12, color: FS.muted, textTransform: 'capitalize' },
  unitLabelActive: { color: '#fff' },
  connectedBadge: { backgroundColor: FS.success + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  connectedText: { fontSize: 12, color: FS.success, fontWeight: '600' },
  localBadge: { backgroundColor: FS.surfaceHigh, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  localText: { fontSize: 12, color: FS.muted },
  signOut: { marginTop: -8 },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: FS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  title: { fontSize: 18, fontWeight: '700', color: FS.text },
  hint: { fontSize: 13, color: FS.muted, lineHeight: 18 },
  input: { backgroundColor: FS.surfaceHigh, borderRadius: 12, padding: 12, paddingHorizontal: 16, fontSize: 14, color: FS.text, borderWidth: 1, borderColor: FS.border },
  error: { fontSize: 13, color: FS.danger, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
