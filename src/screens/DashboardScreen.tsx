import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAppState} from '../state/AppState';
import {requestCorePermissions} from '../permissions';
import {
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
} from '../sms/DirectSms';
import {colors} from '../theme';

function timeAgo(ts: number | null): string {
  if (!ts) {
    return '—';
  }
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5) {
    return 'just now';
  }
  if (secs < 60) {
    return `${secs}s ago`;
  }
  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    return `${mins}m ago`;
  }
  return `${Math.floor(mins / 60)}h ago`;
}

export default function DashboardScreen({onOpenLog}: {onOpenLog: () => void}) {
  const {config, workerState, start, stop, switchDevice, logout} = useAppState();
  const [busy, setBusy] = useState(false);
  const [batteryOptOk, setBatteryOptOk] = useState(true);
  const [, setTick] = useState(0);

  // Re-render once a second so the "last poll" relative time stays fresh.
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

  const onStart = async () => {
    setBusy(true);
    try {
      const perms = await requestCorePermissions();
      if (!perms.sms) {
        Alert.alert(
          'SMS permission required',
          'Without SEND_SMS the worker will mark every job as failed. Grant it in Settings, then start again.',
        );
      }
      await start();
    } finally {
      setBusy(false);
    }
  };

  const onStop = async () => {
    setBusy(true);
    try {
      await stop();
    } finally {
      setBusy(false);
    }
  };

  const onSwitchDevice = () => {
    Alert.alert('Switch device', 'Stop the worker and pick another device?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Switch',
        onPress: async () => {
          setBusy(true);
          try {
            await switchDevice();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert('Logout', 'This stops the worker and signs you out. Continue?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await logout();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onFixBatteryOpt = async () => {
    await requestIgnoreBatteryOptimizations();
    // Re-check shortly after returning from the system dialog.
    setTimeout(() => {
      refreshBatteryOpt();
    }, 1500);
  };

  const s = workerState;
  const online = s.status === 'ONLINE';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refreshBatteryOpt} tintColor={colors.muted} />
      }>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.deviceName}>{config?.deviceName ?? 'Device'}</Text>
          <Text style={styles.server}>{config?.baseUrl}</Text>
        </View>
        <View style={[styles.statusPill, online ? styles.pillOnline : styles.pillOffline]}>
          <Text style={styles.statusText}>{s.status}</Text>
        </View>
      </View>

      {s.needsRePair ? (
        <View style={styles.bannerDanger}>
          <Text style={styles.bannerText}>
            Token rejected (401). Unpair and pair again with a fresh code.
          </Text>
        </View>
      ) : null}

      {s.permissionDenied ? (
        <View style={styles.bannerWarn}>
          <Text style={styles.bannerText}>
            SEND_SMS is denied — jobs are being failed as "sms_permission_denied".
          </Text>
        </View>
      ) : null}

      {!batteryOptOk ? (
        <TouchableOpacity style={styles.bannerWarn} onPress={onFixBatteryOpt}>
          <Text style={styles.bannerText}>
            Battery optimization is ON for this app — tap to disable it for reliable background
            sending.
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.toggle, s.running ? styles.toggleStop : styles.toggleStart, busy && styles.dim]}
        onPress={s.running ? onStop : onStart}
        disabled={busy}>
        <Text style={styles.toggleText}>{s.running ? 'STOP WORKER' : 'START WORKER'}</Text>
      </TouchableOpacity>

      <View style={styles.countersRow}>
        <Counter label="Sent" value={s.counters.sent} tint={colors.success} />
        <Counter label="Failed" value={s.counters.failed} tint={colors.danger} />
        <Counter label="In progress" value={s.counters.inProgress} tint={colors.primary} />
      </View>

      <View style={styles.card}>
        <Row label="Send limit" value={`${config?.sendLimitPerMinute ?? '—'} / min`} />
        <Row label="Last poll" value={timeAgo(s.lastPollAt)} />
        <Row label="Last heartbeat" value={timeAgo(s.lastHeartbeatAt)} />
        <Row label="Battery" value={`${s.batteryLevel}%`} />
        <Row label="Network" value={s.networkType} />
        {s.lastError ? <Row label="Last error" value={s.lastError} tint={colors.danger} /> : null}
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={onOpenLog}>
        <Text style={styles.secondaryText}>View send log</Text>
      </TouchableOpacity>

      <View style={styles.footerRow}>
        <TouchableOpacity onPress={onSwitchDevice} disabled={busy}>
          <Text style={styles.switchText}>Switch device</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} disabled={busy}>
          <Text style={styles.unpairText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Counter({label, value, tint}: {label: string; value: number; tint: string}) {
  return (
    <View style={styles.counter}>
      <Text style={[styles.counterValue, {color: tint}]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

function Row({label, value, tint}: {label: string; value: string; tint?: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, tint ? {color: tint} : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: 20, paddingTop: 56},
  headerRow: {flexDirection: 'row', alignItems: 'center'},
  headerLeft: {flex: 1},
  deviceName: {fontSize: 24, fontWeight: '700', color: colors.text},
  server: {fontSize: 13, color: colors.muted, marginTop: 2},
  statusPill: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999},
  pillOnline: {backgroundColor: 'rgba(34,197,94,0.18)'},
  pillOffline: {backgroundColor: 'rgba(139,147,163,0.18)'},
  statusText: {color: colors.text, fontWeight: '700', fontSize: 12},
  bannerDanger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  bannerWarn: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  bannerText: {color: colors.text, fontSize: 13, lineHeight: 18},
  toggle: {borderRadius: 14, paddingVertical: 22, alignItems: 'center', marginTop: 24},
  toggleStart: {backgroundColor: colors.primary},
  toggleStop: {backgroundColor: colors.danger},
  toggleText: {color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5},
  dim: {opacity: 0.6},
  countersRow: {flexDirection: 'row', marginTop: 20, gap: 12},
  counter: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterValue: {fontSize: 28, fontWeight: '800'},
  counterLabel: {fontSize: 12, color: colors.muted, marginTop: 4},
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7},
  rowLabel: {color: colors.muted, fontSize: 14},
  rowValue: {color: colors.text, fontSize: 14, fontWeight: '600', maxWidth: '60%'},
  secondaryButton: {alignItems: 'center', paddingVertical: 16, marginTop: 20},
  secondaryText: {color: colors.primary, fontSize: 15, fontWeight: '600'},
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  switchText: {color: colors.muted, fontSize: 15, fontWeight: '600'},
  unpairText: {color: colors.danger, fontSize: 15, fontWeight: '600'},
});
