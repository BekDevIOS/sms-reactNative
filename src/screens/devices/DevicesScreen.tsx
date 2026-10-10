import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useAppState} from '../../state/AppState';
import {useMutation, useQuery} from '../../api/queryClient';
import {Device, ListResponse} from '../../api/types';
import {Button, Card, EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
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

  const onReset = async (d: Device) => {
    try {
      const res = await resetCode.mutate(d._id);
      await selectDevice(res.code);
      Alert.alert('Telefon ulandi', 'Ushbu telefon TezkorSMS yuboruvchisi sifatida ulandi. Endi SIM tanlab yuborishni boshlang.');
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
            title="Yuboruvchi telefon ulanmagan"
            hint="Ushbu Android telefonni TezkorSMS hisobiga ulang."
            action={<Button title="Ushbu telefonni ulash" onPress={() => setShowCreate(true)} />}
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
              <Text style={styles.meta}>Tezlik: {item.sendLimitPerMinute}/daqiqa</Text>
              <Text style={styles.meta}>
                SIM: {item.simCarrier ? `SIM ${Number(item.simSlotIndex ?? 0) + 1} · ${item.simCarrier}` : 'tanlanmagan'}
              </Text>
              <Text style={styles.meta}>Oxirgi faollik: {formatRelative(item.lastSeenAt)}</Text>
              {isActive ? <Text style={styles.activeBadge}>● Faol worker qurilmasi</Text> : null}
              <View style={styles.actions}>
                {!isActive ? (
                  <Button
                    title="Ushbu telefonni ulash"
                    onPress={() => onReset(item)}
                    loading={resetCode.isLoading}
                    style={styles.actionBtn}
                  />
                ) : <Button title="Telefondan chiqish" variant="outline" onPress={switchDevice} style={styles.actionBtn} />}
                {isActive ? <Button title="Qayta ulash" variant="ghost" onPress={() => onReset(item)} style={styles.actionBtn} /> : null}
                <Button title="Ulanishni bekor qilish" variant="ghost" onPress={() => setRevokeId(item._id)} style={styles.actionBtn} />
              </View>
            </Card>
          );
        }}
      />

      <AppModal visible={showCreate} title="Ushbu telefonni ulash" onClose={() => setShowCreate(false)}>
        <Input label="Telefon nomi" value={name} onChangeText={setName} placeholder="Masalan: Ofis Samsung" autoCapitalize="none" />
        <Input label="Telefon (ixtiyoriy)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998…" />
        <Button title="Ulash" onPress={onCreate} loading={createDevice.isLoading} style={{marginTop: spacing.xl}} />
      </AppModal>

      <ConfirmDialog
        visible={!!revokeId}
        title="Telefon ulanishini bekor qilish"
        message="SMS worker to‘xtaydi va telefon qayta ulanmaguncha xabar yubormaydi. Davom etamizmi?"
        destructive
        loading={revoke.isLoading}
        onConfirm={async () => {
          if (revokeId) {
            try {
              await revoke.mutate(revokeId);
              if (config?.deviceId === revokeId) await switchDevice();
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
