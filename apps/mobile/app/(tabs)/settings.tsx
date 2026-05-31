import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FS } from '../../constants/theme';
import { FSButton } from '../../components/ui/FSButton';
import { FSIcon } from '../../components/ui/FSIcon';
import { useAuthStore } from '../../stores/authStore';

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
      <FSIcon name={icon} size={20} color={FS.primary} />
      <Text style={s.rowLabel}>{label}</Text>
      {right ?? <FSIcon name="ChevronRight" size={16} color={FS.muted} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [unit, setUnit] = useState<'METRIC' | 'IMPERIAL'>('IMPERIAL');
  const { user, logout } = useAuthStore();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* profile */}
      <View style={s.profile}>
        <FSIcon name="UserCircle" size={52} strokeWidth={1.25} color={FS.muted} />
        <View>
          <Text style={s.profileName}>{user?.name ?? 'Alex'}</Text>
          <Text style={s.profileEmail}>{user?.email ?? 'alex@home.local'}</Text>
        </View>
      </View>

      <Group header="Preferences">
        <Row first icon="Scale" label="Units" onPress={undefined} right={
          <View style={s.unitToggle}>
            {(['METRIC', 'IMPERIAL'] as const).map((u) => (
              <TouchableOpacity key={u} onPress={() => setUnit(u)}
                style={[s.unitOpt, unit === u && s.unitOptActive]} activeOpacity={0.7}>
                <Text style={[s.unitLabel, unit === u && s.unitLabelActive]}>
                  {u.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        } />
        <Row icon="Target" label="Goals" />
        <Row icon="Heart" label="Apple Health" />
      </Group>

      <Group header="Tools">
        <Row first icon="Flame" label="TDEE Calculator" />
      </Group>

      <Group header="Account">
        <Row first icon="Bell" label="Notifications" />
        <Row icon="Shield" label="Privacy" />
        <Row icon="Info" label="About" />
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
  signOut: { marginTop: -8 },
});
