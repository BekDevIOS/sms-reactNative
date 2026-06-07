import React from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useInfiniteList} from '../../api/useInfiniteList';
import {Campaign} from '../../api/types';
import {Button, EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {AddFab, ListRow} from '../../components/ui/layout';
import {campaignStatusLabel, campaignStatusTone} from '../../lib/labels';
import {formatRelative} from '../../lib/format';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';
import type {CampaignsStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<CampaignsStackParamList, 'CampaignsList'>;

export default function CampaignsListScreen({navigation}: Props) {
  const list = useInfiniteList<Campaign>((c, p) => c.getCampaigns(p), {tags: ['Campaign']});

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
        ListEmptyComponent={<EmptyState title="Xabar yo‘q" hint="Birinchi SMS kampaniyangizni yarating." action={<Button title="Yangi xabar" onPress={() => navigation.navigate('CampaignCreate')} />} />}
        renderItem={({item}) => (
          <ListRow
            title={item.title}
            subtitle={
              <View style={{marginTop: 2}}>
                <Text style={styles.msg} numberOfLines={1}>{item.message}</Text>
                <Text style={styles.meta}>{item.sentCount}/{item.totalCount} yuborildi · {formatRelative(item.createdAt)}</Text>
              </View>
            }
            onPress={() => navigation.navigate('CampaignDetail', {id: item._id})}
            trailing={<StatusPill label={campaignStatusLabel[item.status]} tone={campaignStatusTone[item.status]} />}
          />
        )}
      />
      <AddFab onPress={() => navigation.navigate('CampaignCreate')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  listContent: {padding: spacing.lg, gap: spacing.md, paddingBottom: 100},
  msg: {color: colors.muted, fontSize: font.sm},
  meta: {color: colors.muted, fontSize: font.xs, marginTop: 2},
});
