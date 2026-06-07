import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useAppState} from '../../state/AppState';
import {useMutation, useQuery} from '../../api/queryClient';
import {Device, ListResponse} from '../../api/types';
import {Button, Card, EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {AddFab} from '../../components/ui/layout';
import {AppModal, ConfirmDialog} from '../../components/ui/AppModal';
import {Input} from '../../components/ui/form';
import {deviceStatusLabel, deviceStatusTone} from '../../lib/labels';
import {formatRelative} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function DevicesScreen() {
  const {config, selectDevice, switchDevice} = useAppState();
  const devices = useQuery<ListResponse<Device>>(c => c.getDevices(), {tags: ['Device']});
  const createDevice = useMutation((c, body: {name: string; phone?: string}) => c.createDevice({name: body.name, platform: 'ANDROID', phone: body.phone}), {invalidates: ['Device']});
  const resetCode = useMutation((c, id: string) => c.resetDeviceCode(id), {invalidates: ['Device']});
  const revoke = useMutation((c, id: string) => c.revokeDevice(id), {invalidates: ['Device']});

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Nom kerak', 'Qurilmaga nom bering.');
      return;
    }
    try {
      await createDevice.mutate({name: name.trim(), phone: phone.trim() || undefined});
      setShowCreate(false);
      setName('');
      setPhone('');
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    }
  };

  const onUse = async (d: Device) => {
    setBusyId(d._id);
    try {
      await selectDevice(d.code);
      Alert.alert('Tayyor', `"${d.name}" worker qurilmasi sifatida tanlandi.`);
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onReset = async (d: Device) => {
    try {
      const res = await resetCode.mutate(d._id);
      Alert.alert('Yangi kod', `Yangi ulanish kodi: ${res.code}`);
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    }
  };

  if (devices.isLoading) {
    return <LoadingState />;
  }
  if (devices.error && !devices.data) {
    return <ErrorState message={errorMessage(devices.error)} onRetry={devices.refetch} />;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={devices.data?.list ?? []}
        keyExtractor={d => d._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={devices.refetch} tintColor={colors.muted} />}
        ListEmptyComponent={
          <EmptyState
            title="Qurilma yo‘q"
            hint="SMS yuborish uchun qurilma qo‘shing."
            action={<Button title="Qurilma qo‘shish" onPress={() => setShowCreate(true)} />}
          />
        }
        renderItem={({item}) => {
          const isActive = config?.deviceId === item._id;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.name}>{item.name}</Text>
                <StatusPill label={deviceStatusLabel[item.status]} tone={deviceStatusTone[item.status]} />
              </View>
              <Text style={styles.meta}>Kod: {item.code} · {item.sendLimitPerMinute}/daqiqa</Text>
              <Text style={styles.meta}>Oxirgi faollik: {formatRelative(item.lastSeenAt)}</Text>
              {isActive ? <Text style={styles.activeBadge}>● Faol worker qurilmasi</Text> : null}
              <View style={styles.actions}>
                {isActive ? (
                  <Button title="O‘chirish (worker)" variant="outline" onPress={switchDevice} style={styles.actionBtn} />
                ) : (
                  <Button
                    title="Tanlash"
                    onPress={() => onUse(item)}
                    loading={busyId === item._id}
                    style={styles.actionBtn}
                  />
                )}
                <Button title="Kodni yangilash" variant="ghost" onPress={() => onReset(item)} style={styles.actionBtn} />
                <Button title="Bekor qilish" variant="ghost" onPress={() => setRevokeId(item._id)} style={styles.actionBtn} />
              </View>
            </Card>
          );
        }}
      />

      <AddFab onPress={() => setShowCreate(true)} />

      <AppModal visible={showCreate} title="Qurilma qo‘shish" onClose={() => setShowCreate(false)}>
        <Input label="Nom" value={name} onChangeText={setName} placeholder="Masalan: Pixel-1" autoCapitalize="none" />
        <Input label="Telefon (ixtiyoriy)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998…" />
        <Button title="Yaratish" onPress={onCreate} loading={createDevice.isLoading} style={{marginTop: spacing.xl}} />
      </AppModal>

      <ConfirmDialog
        visible={!!revokeId}
        title="Qurilmani bekor qilish"
        message="Bu qurilma ulanishi bekor qilinadi. Davom etamizmi?"
        destructive
        loading={revoke.isLoading}
        onConfirm={async () => {
          if (revokeId) {
            try {
              await revoke.mutate(revokeId);
            } catch (e) {
              Alert.alert('Xatolik', errorMessage(e));
            }
          }
          setRevokeId(null);
        }}
        onCancel={() => setRevokeId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  listContent: {padding: spacing.lg, gap: spacing.md, paddingBottom: 100},
  card: {gap: 4},
  cardHead: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  name: {color: colors.text, fontSize: font.md, fontWeight: '700'},
  meta: {color: colors.muted, fontSize: font.sm},
  activeBadge: {color: colors.success, fontSize: font.sm, fontWeight: '600', marginTop: 4},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  actionBtn: {flexGrow: 1, paddingVertical: 10},
});
