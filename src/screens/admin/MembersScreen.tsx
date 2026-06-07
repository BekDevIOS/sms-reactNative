import React, {useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useInfiniteList} from '../../api/useInfiniteList';
import {Member} from '../../api/types';
import {EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {ListRow, SearchInput} from '../../components/ui/layout';
import {memberRoleLabel, memberStatusLabel, memberStatusTone} from '../../lib/labels';
import {useDebouncedValue} from '../../lib/useDebouncedValue';
import {errorMessage} from '../../lib/errors';
import {colors, spacing} from '../../theme';
import type {AdminMembersStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AdminMembersStackParamList, 'MembersList'>;

export default function MembersScreen({navigation}: Props) {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const list = useInfiniteList<Member>((c, p) => c.getMembers(p), {
    search: search ? {memberEmail: search, memberFirstName: search} : undefined,
    tags: ['Member'],
  });

  if (list.isLoading) {
    return <LoadingState />;
  }
  if (list.error && !list.items.length) {
    return <ErrorState message={errorMessage(list.error)} onRetry={list.refresh} />;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.head}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Email yoki ism…" />
      </View>
      <FlatList
        data={list.items}
        keyExtractor={x => x._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={colors.muted} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState title="Aʼzo topilmadi" />}
        renderItem={({item}) => (
          <ListRow
            title={[item.memberFirstName, item.memberLastName].filter(Boolean).join(' ') || item.memberEmail}
            subtitle={`${item.memberEmail} · ${memberRoleLabel[item.memberRole] ?? item.memberRole}`}
            onPress={() => navigation.navigate('MemberDetail', {id: item._id})}
            trailing={<StatusPill label={memberStatusLabel[item.memberStatus]} tone={memberStatusTone[item.memberStatus]} />}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  head: {padding: spacing.lg, paddingBottom: spacing.sm},
  listContent: {padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 60},
});
