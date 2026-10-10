import React, {useCallback, useEffect, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAppState} from '../../state/AppState';
import {useQuery} from '../../api/queryClient';
import {MemberStats} from '../../api/types';
import {requestCorePermissions} from '../../permissions';
import {
  clearLastCrash,
  getLastCrash,
  getSimCards,
  isIgnoringBatteryOptimizations,
  NativeCrash,
  requestIgnoreBatteryOptimizations,
  SimCard,
} from '../../sms/DirectSms';
import {Button, Card, KeyValueRow, SectionTitle, StatusPill} from '../../components/ui/primitives';
import {Select} from '../../components/ui/form';
import {StatCard} from '../../components/ui/StatCard';
import {formatRelative} from '../../lib/format';
import {colors, font, spacing} from '../../theme';

export default function DashboardScreen({navigation}: any) {
  const {config, workerState, start, stop, member, selectSim} = useAppState();
  const stats = useQuery<MemberStats>(c => c.getMyStats(), {tags: ['Stats']});
  const [busy, setBusy] = useState(false);
  const [batteryOptOk, setBatteryOptOk] = useState(true);
  const [sims, setSims] = useState<SimCard[]>([]);
  const [loadingSims, setLoadingSims] = useState(false);
  const [lastCrash, setLastCrash] = useState<NativeCrash | null>(null);
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
    getLastCrash().then(setLastCrash);
  }, [refreshBatteryOpt]);

  const loadSims = useCallback(async (): Promise<SimCard[]> => {
    setLoadingSims(true);
    try {
      const active = await getSimCards();
      setSims(active);
      return active;
    } catch {
      setSims([]);
      return [];
    } finally {
      setLoadingSims(false);
    }
  }, []);

  const onToggleWorker = async () => {
    if (!config) {
      Alert.alert('Qurilma tanlanmagan', 'Avval qurilma tanlang yoki yarating.', [
        {text: 'Bekor', style: 'cancel'},
        {text: 'Telefonni ulash', onPress: () => navigation.navigate('Devices')},
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
        const activeSims = await loadSims();
        if (!activeSims.length) {
          Alert.alert('SIM topilmadi', 'Faol SIM karta va READ_PHONE_STATE ruxsatini tekshiring.');
          return;
        }
        const selected = activeSims.find(sim => sim.subscriptionId === config.selectedSimSubscriptionId);
        if (!selected && activeSims.length === 1) {
          await selectSim(activeSims[0]);
        } else if (!selected) {
          Alert.alert('SIM tanlang', 'Worker’ni boshlashdan oldin qaysi SIM’dan yuborishni tanlang.');
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
        {value: d.sms.failed, label: 'Yuborilmadi'},
        {value: d.campaigns.sending, label: 'Yuborilmoqda'},
        {value: d.campaigns.done, label: 'Yakunlangan'},
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

        <SectionTitle>Yuboruvchi telefon</SectionTitle>
        {lastCrash ? (
          <TouchableOpacity
            style={styles.bannerDanger}
            onPress={() =>
              Alert.alert(
                'Oldingi yopilish diagnostikasi',
                `${new Date(lastCrash.at).toLocaleString()}\n\n${lastCrash.trace.slice(0, 1800)}`,
                [
                  {text: 'Yopish', style: 'cancel'},
                  {
                    text: 'Tozalash',
                    onPress: async () => {
                      await clearLastCrash();
                      setLastCrash(null);
                    },
                  },
                ],
              )
            }>
            <Text style={styles.bannerText}>
              Ilova oldin kutilmaganda yopilgan. Diagnostikani ko‘rish uchun bosing.
            </Text>
          </TouchableOpacity>
        ) : null}
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
          <KeyValueRow
            label="Tanlangan SIM"
            value={config?.selectedSimCarrier
              ? `SIM ${Number(config.selectedSimSlotIndex ?? 0) + 1} · ${config.selectedSimCarrier}`
              : 'Tanlanmagan'}
          />
          <KeyValueRow label="Oxirgi so'rov" value={s.lastPollAt ? formatRelative(new Date(s.lastPollAt)) : '?'} />
          {s.lastError ? <KeyValueRow label="Oxirgi xato" value={s.lastError} tint={colors.danger} /> : null}
          <Button
            title={s.running ? 'SMS yuborishni to‘xtatish' : 'SMS yuborishni boshlash'}
            variant={s.running ? 'danger' : 'primary'}
            loading={busy}
            disabled={!config}
            onPress={onToggleWorker}
            style={{marginTop: spacing.lg}}
          />
        </Card>

        {config ? (
          <Card style={{marginTop: spacing.md}}>
            <Text style={styles.simTitle}>SMS yuboruvchi SIM</Text>
            {sims.length ? (
              <Select
                value={config.selectedSimSubscriptionId != null ? String(config.selectedSimSubscriptionId) : undefined}
                placeholder="SIM kartani tanlang"
                options={sims.map(sim => ({
                  value: String(sim.subscriptionId),
                  label: `SIM ${sim.slotIndex + 1} · ${sim.carrierName || sim.displayName || 'Noma’lum operator'}`,
                }))}
                onChange={value => {
                  if (s.running) {
                    Alert.alert('Worker’ni to‘xtating', 'SIM almashtirishdan oldin worker’ni to‘xtating.');
                    return;
                  }
                  const sim = sims.find(item => String(item.subscriptionId) === value);
                  if (sim) selectSim(sim);
                }}
              />
            ) : (
              <Button
                title="SIM kartalarni aniqlash"
                variant="outline"
                loading={loadingSims}
                onPress={async () => {
                  const perms = await requestCorePermissions();
                  if (!perms.phone) {
                    Alert.alert('Ruxsat kerak', 'SIM kartalarni ko‘rish uchun telefon holati ruxsatini bering.');
                    return;
                  }
                  await loadSims();
                }}
                style={{marginTop: spacing.md}}
              />
            )}
          </Card>
        ) : null}

        <Button
          title="Tezkor SMS yuborish"
          onPress={() => navigation.navigate('Campaigns', {screen: 'CampaignCreate'})}
          disabled={!config}
          style={{marginTop: spacing.lg}}
        />

        <SectionTitle>So‘nggi ko‘rsatkichlar</SectionTitle>
        <View style={styles.grid}>
          {cards.map((c, i) => (
            <View key={i} style={styles.cell}>
              <StatCard value={c.value} label={c.label} />
            </View>
          ))}
          {!d && !stats.isLoading ? <Text style={styles.muted}>Statistikani yuklab bo‘lmadi.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60},
  hello: {color: colors.text, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.sm},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs},
  cell: {width: '50%', padding: spacing.xs},
  muted: {color: colors.muted, fontSize: font.sm, padding: spacing.sm},
  bannerDanger: {backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: 12, marginTop: spacing.md},
  bannerWarn: {backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 10, padding: 12, marginTop: spacing.md},
  bannerText: {color: colors.text, fontSize: font.sm, lineHeight: 18},
  simTitle: {color: colors.text, fontSize: font.md, fontWeight: '700'},
});
