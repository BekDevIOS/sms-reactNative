import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useAppState} from '../../state/AppState';
import {Button, Card, KeyValueRow} from '../../components/ui/primitives';
import {Input} from '../../components/ui/form';
import {ConfirmDialog} from '../../components/ui/AppModal';
import {memberRoleLabel} from '../../lib/labels';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function ProfileScreen() {
  const {member, updateMe, logout} = useAppState();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(member?.memberPhone ?? '');
  const [company, setCompany] = useState(member?.memberCompanyName ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Prefill names from the cached display name on first render.
  const [seeded, setSeeded] = useState(false);
  if (!seeded && member) {
    const parts = member.memberName.split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' '));
    setSeeded(true);
  }

  const onSave = async () => {
    setSaving(true);
    try {
      await updateMe({
        memberFirstName: firstName.trim() || undefined,
        memberLastName: lastName.trim() || undefined,
        memberPhone: phone.trim() || undefined,
        memberCompanyName: company.trim() || undefined,
      });
      Alert.alert('Saqlandi', 'Profil yangilandi.');
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Card>
        <KeyValueRow label="Email" value={member?.memberEmail ?? '—'} />
        <KeyValueRow
          label="Rol"
          value={member ? memberRoleLabel[member.memberRole] ?? member.memberRole : '—'}
        />
        <KeyValueRow label="Qurilmalar" value={member?.memberDevices ?? 0} />
      </Card>

      <Text style={styles.section}>Ma'lumotlarni tahrirlash</Text>
      <Input label="Ism" value={firstName} onChangeText={setFirstName} placeholder="Ism" />
      <Input label="Familiya" value={lastName} onChangeText={setLastName} placeholder="Familiya" />
      <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998…" />
      <Input label="Kompaniya" value={company} onChangeText={setCompany} placeholder="Kompaniya" />

      <Button title="Saqlash" onPress={onSave} loading={saving} style={{marginTop: spacing.xl}} />

      <View style={{marginTop: spacing.xxl}}>
        <Button title="Chiqish" variant="danger" onPress={() => setConfirmLogout(true)} />
      </View>

      <ConfirmDialog
        visible={confirmLogout}
        title="Chiqish"
        message="Worker to‘xtaydi va hisobdan chiqasiz. Davom etamizmi?"
        confirmLabel="Chiqish"
        destructive
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60},
  section: {color: colors.text, fontSize: font.md, fontWeight: '700', marginTop: spacing.xl},
});
