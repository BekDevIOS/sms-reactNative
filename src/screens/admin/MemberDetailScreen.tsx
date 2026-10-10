import React, {useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation, useQuery} from '../../api/queryClient';
import {Member, MemberRole, MemberStatus, SubscriptionPlan} from '../../api/types';
import {Button, Card, ErrorState, KeyValueRow, LoadingState, SectionTitle} from '../../components/ui/primitives';
import {Input, Select} from '../../components/ui/form';
import {memberRoleLabel, memberStatusLabel} from '../../lib/labels';
import {formatDate} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, spacing} from '../../theme';
import type {AdminMembersStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AdminMembersStackParamList, 'MemberDetail'>;

const ROLE_OPTS: {value: MemberRole; label: string}[] = [
  {value: 'USER', label: memberRoleLabel.USER},
  {value: 'ADMIN', label: memberRoleLabel.ADMIN},
  {value: 'OWNER', label: memberRoleLabel.OWNER},
];
const STATUS_OPTS: {value: MemberStatus; label: string}[] = [
  {value: 'ACTIVE', label: memberStatusLabel.ACTIVE},
  {value: 'BLOCKED', label: memberStatusLabel.BLOCKED},
  {value: 'DELETED', label: memberStatusLabel.DELETED},
];
const PLAN_OPTS: {value: SubscriptionPlan; label: string}[] = [
  {value: 'BASIC', label: 'Basic'},
  {value: 'PRO', label: 'Pro'},
  {value: 'ENTERPRISE', label: 'Enterprise'},
];

export default function MemberDetailScreen({route}: Props) {
  const {id} = route.params;
  const q = useQuery<Member>(c => c.getMember(id), {tags: ['Member'], deps: [id]});
  const updateMember = useMutation((c, a: {role: MemberRole; status: MemberStatus}) => c.updateMember(id, {memberRole: a.role, memberStatus: a.status}), {invalidates: ['Member']});
  const activate = useMutation((c, a: {plan: SubscriptionPlan; durationDays?: number}) => c.activateSubscription(id, {plan: a.plan, durationDays: a.durationDays}), {invalidates: ['Subscription', 'Member']});

  const [role, setRole] = useState<MemberRole>('USER');
  const [status, setStatus] = useState<MemberStatus>('ACTIVE');
  const [plan, setPlan] = useState<SubscriptionPlan>('BASIC');
  const [days, setDays] = useState('30');
  const [seeded, setSeeded] = useState(false);

  if (q.data && !seeded) {
    setRole(q.data.memberRole);
    setStatus(q.data.memberStatus);
    setSeeded(true);
  }

  if (q.isLoading) {
    return <LoadingState />;
  }
  if (q.error || !q.data) {
    return <ErrorState message={errorMessage(q.error)} onRetry={q.refetch} />;
  }
  const m = q.data;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={q.refetch} tintColor={colors.muted} />}>
      <Card>
        <KeyValueRow label="Ism" value={[m.memberFirstName, m.memberLastName].filter(Boolean).join(' ') || '—'} />
        <KeyValueRow label="Email" value={m.memberEmail} />
        <KeyValueRow label="Telefon" value={m.memberPhone || '—'} />
        <KeyValueRow label="Kompaniya" value={m.memberCompanyName || '—'} />
        <KeyValueRow label="Yuboruvchi telefon" value={m.memberDevices ? 'Ulangan' : 'Ulanmagan'} />
        {m.createdAt ? <KeyValueRow label="Ro‘yxatdan o‘tgan" value={formatDate(m.createdAt)} /> : null}
      </Card>

      <SectionTitle>Rol va holat</SectionTitle>
      <Select label="Rol" value={role} options={ROLE_OPTS} onChange={setRole} />
      <Select label="Holat" value={status} options={STATUS_OPTS} onChange={setStatus} />
      <Button
        title="Saqlash"
        loading={updateMember.isLoading}
        onPress={async () => {
          try {
            await updateMember.mutate({role, status});
            Alert.alert('Saqlandi', 'Aʼzo yangilandi.');
          } catch (e) {
            Alert.alert('Xatolik', errorMessage(e));
          }
        }}
        style={{marginTop: spacing.lg}}
      />

      <SectionTitle>Obuna faollashtirish</SectionTitle>
      <Select label="Tarif" value={plan} options={PLAN_OPTS} onChange={setPlan} />
      <Input label="Muddat (kun)" value={days} onChangeText={setDays} keyboardType="numeric" placeholder="30" />
      <Button
        title="Faollashtirish"
        variant="outline"
        loading={activate.isLoading}
        onPress={async () => {
          try {
            await activate.mutate({plan, durationDays: Number(days) || undefined});
            Alert.alert('Faollashtirildi', 'Obuna faollashtirildi.');
          } catch (e) {
            Alert.alert('Xatolik', errorMessage(e));
          }
        }}
        style={{marginTop: spacing.lg}}
      />
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60},
});
