import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useMutation, useQuery} from '../../api/queryClient';
import {Plan} from '../../api/types';
import {Button, Card, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {AppModal} from '../../components/ui/AppModal';
import {Input, SwitchRow} from '../../components/ui/form';
import {formatLimit, formatPrice} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function AdminPlansScreen() {
  const plans = useQuery<Plan[]>(c => c.getAdminPlans(), {tags: ['Plan']});
  const update = useMutation((c, a: {code: Plan['code']; data: any}) => c.updatePlan(a.code, a.data), {invalidates: ['Plan']});

  const [editing, setEditing] = useState<Plan | null>(null);
  const [price, setPrice] = useState('');
  const [daily, setDaily] = useState('');
  const [duration, setDuration] = useState('');
  const [active, setActive] = useState(true);

  const open = (p: Plan) => {
    setEditing(p);
    setPrice(p.price?.toString() ?? '');
    setDaily(p.dailySmsLimit?.toString() ?? '');
    setDuration(p.durationDays?.toString() ?? '');
    setActive(p.isActive);
  };

  const num = (s: string): number | null => (s.trim() === '' ? null : Number(s));

  const onSave = async () => {
    if (!editing) {
      return;
    }
    try {
      await update.mutate({
        code: editing.code,
        data: {price: num(price), dailySmsLimit: num(daily), deviceLimit: 1, durationDays: num(duration), isActive: active},
      });
      setEditing(null);
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    }
  };

  if (plans.isLoading) {
    return <LoadingState />;
  }
  if (plans.error || !plans.data) {
    return <ErrorState message={errorMessage(plans.error)} onRetry={plans.refetch} />;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={plans.data}
        keyExtractor={p => p._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={plans.refetch} tintColor={colors.muted} />}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <StatusPill label={item.isActive ? 'Faol' : 'O‘chiq'} tone={item.isActive ? 'success' : 'neutral'} />
            </View>
            <Text style={styles.meta}>{formatPrice(item.price, item.currency)}</Text>
            <Text style={styles.meta}>Kunlik SMS: {formatLimit(item.dailySmsLimit)} · Telefon: 1 ta</Text>
            <Button title="Tahrirlash" variant="outline" onPress={() => open(item)} style={{marginTop: spacing.md}} />
          </Card>
        )}
      />

      <AppModal visible={!!editing} title={editing ? `${editing.name} — tahrirlash` : ''} onClose={() => setEditing(null)}>
        <Input label="Narx (bo‘sh = kelishuv)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
        <Input label="Kunlik SMS limiti (bo‘sh = cheksiz)" value={daily} onChangeText={setDaily} keyboardType="numeric" />
        <Input label="Muddat (kun, bo‘sh = cheksiz)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <SwitchRow label="Faol" value={active} onValueChange={setActive} />
        <Button title="Saqlash" onPress={onSave} loading={update.isLoading} style={{marginTop: spacing.xl}} />
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  listContent: {padding: spacing.lg, gap: spacing.md, paddingBottom: 60},
  card: {gap: 2},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  name: {color: colors.text, fontSize: font.md, fontWeight: '700'},
  meta: {color: colors.muted, fontSize: font.sm},
});
