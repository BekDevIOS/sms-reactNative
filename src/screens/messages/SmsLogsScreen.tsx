import React, {useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useInfiniteList} from '../../api/useInfiniteList';
import {SmsLog, SmsLogStatus} from '../../api/types';
import {EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {smsLogStatusLabel, smsLogStatusTone} from '../../lib/labels';
import {formatRelative} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

const STATUS_FILTERS: {value: string; label: string}[] = [
  {value: '', label: 'Hammasi'},
  {value: 'SENT', label: 'Yuborildi'},
  {value: 'DELIVERED', label: 'Yetkazildi'},
  {value: 'FAILED', label: 'Xato'},
];

/** Shared SMS-log list for both member (/sms-log) and admin (/admin/sms-log). */
export function SmsLogsList({admin = false}: {admin?: boolean}) {
  const [status, setStatus] = useState('');
  const list = useInfiniteList<SmsLog>(
    (c, params) => (admin ? c.getAdminSmsLogs(params) : c.getSmsLogs(params)),
    {status: status || undefined, tags: ['SmsLog']},
  );

  if (list.isLoading) {
    return <LoadingState />;
  }
  if (list.error && !list.items.length) {
    return <ErrorState message={errorMessage(list.error)} onRetry={list.refresh} />;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.filters}>
        {STATUS_FILTERS.map(f => (
          <Text
            key={f.value}
            onPress={() => setStatus(f.value)}
            style={[styles.filter, status === f.value && styles.filterActive]}>
            {f.label}
          </Text>
        ))}
      </View>
      <FlatList
        data={list.items}
        keyExtractor={x => x._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={colors.muted} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState title="SMS yo‘q" hint="Hozircha jurnal bo‘sh." />}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.phone}>{item.phone || '—'}</Text>
              {item.message ? (
                <Text style={styles.msg} numberOfLines={2}>
                  {item.message}
                </Text>
              ) : null}
              <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
            </View>
            <StatusPill
              label={smsLogStatusLabel[item.status as SmsLogStatus] ?? item.status}
              tone={smsLogStatusTone[item.status as SmsLogStatus] ?? 'neutral'}
            />
          </View>
        )}
      />
    </View>
  );
}

export default function SmsLogsScreen() {
  return <SmsLogsList />;
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  filters: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm},
  filter: {
    color: colors.muted,
    fontSize: font.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  filterActive: {color: '#fff', backgroundColor: colors.primary},
  listContent: {padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md},
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  rowMain: {flex: 1},
  phone: {color: colors.text, fontSize: font.md, fontWeight: '600'},
  msg: {color: colors.muted, fontSize: font.sm, marginTop: 2},
  time: {color: colors.muted, fontSize: font.xs, marginTop: 4},
});
