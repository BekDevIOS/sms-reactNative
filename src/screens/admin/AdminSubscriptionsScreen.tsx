import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useInfiniteList} from '../../api/useInfiniteList';
import {useMutation} from '../../api/queryClient';
import {Subscription} from '../../api/types';
import {EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {ListRow} from '../../components/ui/layout';
import {ConfirmDialog} from '../../components/ui/AppModal';
import {subscriptionPlanLabel, subscriptionStatusLabel, subscriptionStatusTone} from '../../lib/labels';
import {formatDate, formatLimit} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function AdminSubscriptionsScreen() {
  const list = useInfiniteList<Subscription>((c, p) => c.getAdminSubscriptions(p), {tags: ['Subscription']});
  const cancel = useMutation((c, id: string) => c.cancelSubscription(id), {invalidates: ['Subscription']});
  const [cancelId, setCancelId] = useState<string | null>(null);

  if (list.isLoading) {
    return <LoadingState />;
  }
  if (list.error && !list.items.length) {
    return <ErrorState message={errorMessage(list.error)} onRetry={list.refresh} />;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={list.items}
        keyExtractor={x => x._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={colors.muted} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState title="Obuna yo‘q" />}
        renderItem={({item}) => (
          <ListRow
            title={subscriptionPlanLabel[item.plan]}
            subtitle={
              <View>
                <Text style={styles.meta}>Tugaydi: {item.expiresAt ? formatDate(item.expiresAt) : 'Cheksiz'}</Text>
                <Text style={styles.meta}>Kunlik SMS: {formatLimit(item.dailySmsLimit)}</Text>
              </View>
            }
            trailing={
              <View style={{alignItems: 'flex-end', gap: 6}}>
                <StatusPill label={subscriptionStatusLabel[item.status]} tone={subscriptionStatusTone[item.status]} />
                {item.status === 'ACTIVE' ? (
                  <Text style={styles.cancel} onPress={() => setCancelId(item._id)}>Bekor qilish</Text>
                ) : null}
              </View>
            }
          />
        )}
      />

      <ConfirmDialog
        visible={!!cancelId}
        title="Obunani bekor qilish"
        destructive
        loading={cancel.isLoading}
        onConfirm={async () => {
          if (cancelId) {
            try {
              await cancel.mutate(cancelId);
            } catch (e) {
              Alert.alert('Xatolik', errorMessage(e));
            }
          }
          setCancelId(null);
        }}
        onCancel={() => setCancelId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  listContent: {padding: spacing.lg, gap: spacing.md, paddingBottom: 60},
  meta: {color: colors.muted, fontSize: font.sm},
  cancel: {color: colors.danger, fontSize: font.xs, fontWeight: '600'},
});
