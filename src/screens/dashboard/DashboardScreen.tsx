import React, {useCallback, useEffect, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAppState} from '../../state/AppState';
import {useQuery} from '../../api/queryClient';
import {MemberStats} from '../../api/types';
import {requestCorePermissions} from '../../permissions';
import {isIgnoringBatteryOptimizations, requestIgnoreBatteryOptimizations} from '../../sms/DirectSms';
import {Card, KeyValueRow, SectionTitle, StatusPill} from '../../components/ui/primitives';
import {StatCard} from '../../components/ui/StatCard';
import {WorkerFab} from '../../components/ui/WorkerFab';
import {formatRelative} from '../../lib/format';
import {colors, font, spacing} from '../../theme';

export default function DashboardScreen({navigation}: any) {
  const {config, workerState, start, stop, member} = useAppState();
  const stats = useQuery<MemberStats>(c => c.getMyStats(), {tags: ['Stats']});
  const [busy, setBusy] = useState(false);
  const [batteryOptOk, setBatteryOptOk] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const refreshBatteryOpt = useCallback(async () => {
    setBatteryOptOk(await isIgnoringBatteryOptimizations());
  }, []);

  useEffect(() => {
    refreshBatteryOpt();
  }, [refreshBatteryOpt]);

  const onToggleWorker = async () => {
    if (!config) {
      Alert.alert('Qurilma tanlanmagan', 'Avval qurilma tanlang yoki yarating.', [
        {text: 'Bekor', style: 'cancel'},
        {text: 'Qurilmalar', onPress: () => navigation.navigate('Devices')},
      ]);
      return;
    }

    setBusy(true);
    try {
      if (workerState.running) {
        await stop();
      } else {
        const perms = await requestCorePermissions();
        if (!perms.sms) {
          Alert.alert('SMS ruxsati kerak', 'SEND_SMS berilmasa har bir job xato deb belgilanadi.');
          return;
        }
        if (!perms.notifications) {
          Alert.alert(
            'Notification ruxsati kerak',
            "Background worker ko'rinib turishi uchun notification ruxsatini bering.",
          );
          return;
        }
        await start();
      }
    } finally {
      setBusy(false);
    }
  };

  const onFixBatteryOpt = async () => {
    await requestIgnoreBatteryOptimizations();
    setTimeout(refreshBatteryOpt, 1500);
  };

  const s = workerState;
  const d = stats.data;
  const cards: {value: number; label: string}[] = d
    ? [
        {value: d.sms.sent, label: 'Yuborilgan'},
        {value: d.sms.delivered, label: 'Yetkazilgan'},
        {value: d.sms.failed, label: 'Yuborilmadi'},
        {value: d.campaigns.scheduled, label: 'Rejalashtirilgan'},
        {value: d.campaigns.sending, label: 'Yuborilmoqda'},
        {value: d.campaigns.done, label: 'Yakunlangan'},
        {value: d.devices.online, label: 'Onlayn qurilma'},
        {value: d.campaigns.total, label: 'Kampaniyalar'},
      ]
    : [];

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={stats.isLoading}
            onRefresh={() => {
              stats.refetch();
              refreshBatteryOpt();
            }}
            tintColor={colors.muted}
          />
        }>
        <Text style={styles.hello}>Salom, {member?.memberName || 'foydalanuvchi'}</Text>

        <SectionTitle>Xabarlar</SectionTitle>
        <View style={styles.grid}>
          {cards.map((c, i) => (
            <View key={i} style={styles.cell}>
              <StatCard value={c.value} label={c.label} />
            </View>
          ))}
          {!d && !stats.isLoading ? (
            <Text style={styles.muted}>Statistikani yuklab bo'lmadi.</Text>
          ) : null}
        </View>

        <SectionTitle>Yuboruvchi qurilma</SectionTitle>
        {s.needsRePair ? (
          <View style={styles.bannerDanger}>
            <Text style={styles.bannerText}>Token rad etildi (401). Qurilmani qaytadan ulang.</Text>
          </View>
        ) : null}
        {s.permissionDenied ? (
          <View style={styles.bannerWarn}>
            <Text style={styles.bannerText}>SEND_SMS rad etilgan. Joblar xato deb belgilanmoqda.</Text>
          </View>
        ) : null}
        {!batteryOptOk ? (
          <TouchableOpacity style={styles.bannerWarn} onPress={onFixBatteryOpt}>
            <Text style={styles.bannerText}>
              Batareya optimizatsiyasi yoqilgan. Ishonchli ishlash uchun o'chiring (bosing).
            </Text>
          </TouchableOpacity>
        ) : null}

        <Card style={{marginTop: spacing.md}}>
          <KeyValueRow label="Qurilma" value={config?.deviceName ?? 'Tanlanmagan'} />
          <KeyValueRow
            label="Holat"
            value={<StatusPill label={s.status} tone={s.status === 'ONLINE' ? 'success' : 'neutral'} />}
          />
          <KeyValueRow label="Yuborildi (sessiya)" value={s.counters.sent} tint={colors.success} />
          <KeyValueRow label="Xato (sessiya)" value={s.counters.failed} tint={colors.danger} />
          <KeyValueRow label="Jarayonda" value={s.counters.inProgress} tint={colors.primary} />
          <KeyValueRow label="Limit" value={`${config?.sendLimitPerMinute ?? '?'} / daqiqa`} />
          <KeyValueRow label="Oxirgi so'rov" value={s.lastPollAt ? formatRelative(new Date(s.lastPollAt)) : '?'} />
          {s.lastError ? <KeyValueRow label="Oxirgi xato" value={s.lastError} tint={colors.danger} /> : null}
        </Card>

        <Text style={styles.fabHint}>
          {config
            ? s.running
              ? "Worker ishlamoqda. To'xtatish uchun pastdagi tugmani bosing."
              : "Worker to'xtagan. Boshlash uchun pastdagi tugmani bosing."
            : "SMS yuborish uchun avval qurilma tanlang (Qurilmalar bo'limi)."}
        </Text>
      </ScrollView>

      <WorkerFab running={s.running} busy={busy} disabled={!config} onPress={onToggleWorker} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 120},
  hello: {color: colors.text, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.sm},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs},
  cell: {width: '50%', padding: spacing.xs},
  muted: {color: colors.muted, fontSize: font.sm, padding: spacing.sm},
  bannerDanger: {backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: 12, marginTop: spacing.md},
  bannerWarn: {backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 10, padding: 12, marginTop: spacing.md},
  bannerText: {color: colors.text, fontSize: font.sm, lineHeight: 18},
  fabHint: {color: colors.muted, fontSize: font.xs, marginTop: spacing.lg, lineHeight: 18, paddingRight: 72},
});
