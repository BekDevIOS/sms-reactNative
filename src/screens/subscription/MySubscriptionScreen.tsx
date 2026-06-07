import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useQuery} from '../../api/queryClient';
import {Plan, Subscription} from '../../api/types';
import {Card, EmptyState, LoadingState, SectionTitle, StatusPill} from '../../components/ui/primitives';
import {subscriptionPlanLabel, subscriptionStatusLabel, subscriptionStatusTone} from '../../lib/labels';
import {formatDate, formatLimit, formatPrice} from '../../lib/format';
import {colors, font, spacing} from '../../theme';

export default function MySubscriptionScreen() {
  const sub = useQuery<Subscription | null>(c => c.getMySubscription(), {tags: ['Subscription']});
  const plans = useQuery<Plan[]>(c => c.getPlans(), {tags: ['Plan']});

  if (sub.isLoading || plans.isLoading) {
    return <LoadingState />;
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            sub.refetch();
            plans.refetch();
          }}
          tintColor={colors.muted}
        />
      }>
      <SectionTitle>Mening obunam</SectionTitle>
      {sub.data ? (
        <Card>
          <View style={styles.row}>
            <Text style={styles.plan}>{subscriptionPlanLabel[sub.data.plan]}</Text>
            <StatusPill label={subscriptionStatusLabel[sub.data.status]} tone={subscriptionStatusTone[sub.data.status]} />
          </View>
          <Text style={styles.meta}>Boshlangan: {formatDate(sub.data.startsAt)}</Text>
          <Text style={styles.meta}>Tugaydi: {sub.data.expiresAt ? formatDate(sub.data.expiresAt) : 'Cheksiz'}</Text>
          <Text style={styles.meta}>Kunlik SMS: {formatLimit(sub.data.dailySmsLimit)}</Text>
          <Text style={styles.meta}>Qurilma limiti: {formatLimit(sub.data.deviceLimit)}</Text>
        </Card>
      ) : (
        <EmptyState title="Faol obuna yo‘q" hint="Tarif tanlash uchun administrator bilan bog‘laning." />
      )}

      <SectionTitle>Tariflar</SectionTitle>
      {(plans.data ?? []).filter(p => p.isActive).map(p => (
        <Card key={p._id} style={styles.planCard}>
          <View style={styles.row}>
            <Text style={styles.plan}>{p.name}</Text>
            <Text style={styles.price}>{formatPrice(p.price, p.currency)}</Text>
          </View>
          {p.description ? <Text style={styles.meta}>{p.description}</Text> : null}
          <Text style={styles.meta}>Kunlik SMS: {formatLimit(p.dailySmsLimit)} · Qurilma: {formatLimit(p.deviceLimit)}</Text>
          {p.features?.map((f, i) => (
            <Text key={i} style={styles.feature}>• {f}</Text>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60, gap: spacing.md},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  plan: {color: colors.text, fontSize: font.lg, fontWeight: '700'},
  price: {color: colors.primary, fontSize: font.md, fontWeight: '700'},
  meta: {color: colors.muted, fontSize: font.sm, marginTop: 2},
  feature: {color: colors.text, fontSize: font.sm, marginTop: 2},
  planCard: {gap: 2},
});
