import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import {useQuery} from '../../api/queryClient';
import {AdminStats} from '../../api/types';
import {LoadingState, SectionTitle} from '../../components/ui/primitives';
import {StatCard} from '../../components/ui/StatCard';
import {colors, spacing} from '../../theme';

export default function AdminDashboardScreen() {
  const stats = useQuery<AdminStats>(c => c.getAdminStats(), {tags: ['Stats']});

  if (stats.isLoading) {
    return <LoadingState />;
  }
  const d = stats.data;

  const cards: {value: number; label: string}[] = d
    ? [
        {value: d.members.total, label: 'Aʼzolar'},
        {value: d.members.active, label: 'Faol aʼzolar'},
        {value: d.members.blocked, label: 'Bloklangan'},
        {value: d.devicesOnline, label: 'Onlayn qurilma'},
        {value: d.sms.sent, label: 'Yuborilgan SMS'},
        {value: d.sms.failed, label: 'Xato SMS'},
        {value: d.campaigns.total, label: 'Kampaniyalar'},
        {value: d.subscriptions.byStatus.ACTIVE, label: 'Faol obunalar'},
      ]
    : [];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={stats.refetch} tintColor={colors.muted} />}>
      <SectionTitle>Umumiy statistika</SectionTitle>
      <View style={styles.grid}>
        {cards.map((c, i) => (
          <View key={i} style={styles.cell}>
            <StatCard value={c.value} label={c.label} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs},
  cell: {width: '50%', padding: spacing.xs},
});
