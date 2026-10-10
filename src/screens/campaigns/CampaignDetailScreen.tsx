import React, {useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation, useQuery} from '../../api/queryClient';
import {CampaignDetail, Device, ListResponse} from '../../api/types';
import {Button, Card, ErrorState, KeyValueRow, LoadingState, SectionTitle, StatusPill} from '../../components/ui/primitives';
import {ConfirmDialog} from '../../components/ui/AppModal';
import {campaignStatusLabel, campaignStatusTone} from '../../lib/labels';
import {formatDate} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';
import type {CampaignsStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<CampaignsStackParamList, 'CampaignDetail'>;

export default function CampaignDetailScreen({route}: Props) {
  const {id} = route.params;
  const q = useQuery<CampaignDetail>(c => c.getCampaign(id), {tags: ['Campaign'], deps: [id]});
  const devices = useQuery<ListResponse<Device>>(client => client.getDevices(), {tags: ['Device']});
  const cancel = useMutation((c, cid: string) => c.cancelCampaign(cid), {invalidates: ['Campaign', 'Stats']});
  const [confirm, setConfirm] = useState(false);

  if (q.isLoading) {
    return <LoadingState />;
  }
  if (q.error || !q.data) {
    return <ErrorState message={errorMessage(q.error)} onRetry={q.refetch} />;
  }

  const c = q.data;
  const sender = devices.data?.list.find(device => device._id === c.senderDeviceId);
  const canCancel = c.status === 'SCHEDULED' || c.status === 'SENDING';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={q.refetch} tintColor={colors.muted} />}>
      <View style={styles.head}>
        <Text style={styles.title}>{c.title}</Text>
        <StatusPill label={campaignStatusLabel[c.status]} tone={campaignStatusTone[c.status]} />
      </View>

      <Card style={{marginTop: spacing.md}}>
        <Text style={styles.message}>{c.message}</Text>
      </Card>

      <SectionTitle>Holat</SectionTitle>
      <Card>
        <KeyValueRow label="Jami" value={c.totalCount} />
        {sender ? <KeyValueRow label="Yuboruvchi" value={`${sender.name}${sender.simCarrier ? ` · SIM ${Number(sender.simSlotIndex ?? 0) + 1}` : ''}`} /> : null}
        <KeyValueRow label="Yuborildi" value={c.sentCount} tint={colors.success} />
        <KeyValueRow label="Xato" value={c.failedCount} tint={colors.danger} />
        {c.progress ? (
          <>
            <KeyValueRow label="Kutilmoqda" value={c.progress.pending} />
            <KeyValueRow label="Jarayonda" value={c.progress.processing} tint={colors.primary} />
          </>
        ) : null}
        {c.scheduledAt ? <KeyValueRow label="Reja vaqti" value={formatDate(c.scheduledAt)} /> : null}
        <KeyValueRow label="Yaratilgan" value={formatDate(c.createdAt)} />
      </Card>

      {canCancel ? (
        <Button title="Bekor qilish" variant="danger" onPress={() => setConfirm(true)} style={{marginTop: spacing.xl}} />
      ) : null}

      <ConfirmDialog
        visible={confirm}
        title="Kampaniyani bekor qilish"
        message="Yuborilmagan xabarlar to‘xtatiladi."
        destructive
        loading={cancel.isLoading}
        onConfirm={async () => {
          try {
            await cancel.mutate(id);
            q.refetch();
          } catch (e) {
            Alert.alert('Xatolik', errorMessage(e));
          }
          setConfirm(false);
        }}
        onCancel={() => setConfirm(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60, gap: spacing.md},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md},
  title: {color: colors.text, fontSize: font.xl, fontWeight: '800', flex: 1},
  message: {color: colors.text, fontSize: font.md, lineHeight: 22},
});
