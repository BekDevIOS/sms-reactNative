import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useInfiniteList} from '../../api/useInfiniteList';
import {useMutation} from '../../api/queryClient';
import {AutoReply, AutoReplyMatchType} from '../../api/types';
import {Button, EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {AddFab, ListRow} from '../../components/ui/layout';
import {AppModal, ConfirmDialog} from '../../components/ui/AppModal';
import {Input, Select, SwitchRow} from '../../components/ui/form';
import {autoReplyMatchLabel} from '../../lib/labels';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

const MATCH_OPTIONS: {value: AutoReplyMatchType; label: string}[] = [
  {value: 'EXACT', label: autoReplyMatchLabel.EXACT},
  {value: 'CONTAINS', label: autoReplyMatchLabel.CONTAINS},
  {value: 'PREFIX', label: autoReplyMatchLabel.PREFIX},
];

export default function AutoReplyScreen() {
  const list = useInfiniteList<AutoReply>((c, p) => c.getAutoReplies(p), {tags: ['AutoReply']});
  const create = useMutation((c, b: any) => c.createAutoReply(b), {invalidates: ['AutoReply']});
  const update = useMutation((c, a: {id: string; data: any}) => c.updateAutoReply(a.id, a.data), {invalidates: ['AutoReply']});
  const remove = useMutation((c, id: string) => c.deleteAutoReply(id), {invalidates: ['AutoReply']});

  const [editing, setEditing] = useState<AutoReply | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [reply, setReply] = useState('');
  const [matchType, setMatchType] = useState<AutoReplyMatchType>('CONTAINS');
  const [enabled, setEnabled] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setTrigger('');
    setReply('');
    setMatchType('CONTAINS');
    setEnabled(true);
    setShowForm(true);
  };
  const openEdit = (a: AutoReply) => {
    setEditing(a);
    setTrigger(a.triggerText);
    setReply(a.replyBody);
    setMatchType(a.matchType);
    setEnabled(a.enabled);
    setShowForm(true);
  };

  const onSubmit = async () => {
    if (!trigger.trim() || !reply.trim()) {
      Alert.alert('To‘ldiring', 'Trigger va javob matni shart.');
      return;
    }
    const data = {triggerText: trigger.trim(), replyBody: reply.trim(), matchType, enabled};
    try {
      if (editing) {
        await update.mutate({id: editing._id, data});
      } else {
        await create.mutate(data);
      }
      setShowForm(false);
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    }
  };

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
        ListEmptyComponent={<EmptyState title="Avto-javob yo‘q" hint="Kelgan xabarlarga avtomatik javob qo‘shing." action={<Button title="Qo‘shish" onPress={openCreate} />} />}
        renderItem={({item}) => (
          <ListRow
            title={item.triggerText}
            subtitle={item.replyBody}
            onPress={() => openEdit(item)}
            trailing={
              <View style={{alignItems: 'flex-end', gap: 4}}>
                <StatusPill label={item.enabled ? 'Yoqilgan' : 'O‘chiq'} tone={item.enabled ? 'success' : 'neutral'} />
                <Text style={styles.match}>{autoReplyMatchLabel[item.matchType]}</Text>
              </View>
            }
          />
        )}
      />

      <AddFab onPress={openCreate} />

      <AppModal visible={showForm} title={editing ? 'Tahrirlash' : 'Avto-javob qo‘shish'} onClose={() => setShowForm(false)}>
        <Input label="Trigger matni" value={trigger} onChangeText={setTrigger} placeholder="Masalan: narx" />
        <Input label="Javob matni" value={reply} onChangeText={setReply} placeholder="Avtomatik yuboriladigan javob" multiline />
        <Select label="Moslik turi" value={matchType} options={MATCH_OPTIONS} onChange={setMatchType} />
        <SwitchRow label="Yoqilgan" value={enabled} onValueChange={setEnabled} />
        <Button title="Saqlash" onPress={onSubmit} loading={create.isLoading || update.isLoading} style={{marginTop: spacing.xl}} />
        {editing ? (
          <Button title="O‘chirish" variant="ghost" onPress={() => {setShowForm(false); setDeleteId(editing._id);}} style={{marginTop: spacing.sm}} />
        ) : null}
      </AppModal>

      <ConfirmDialog
        visible={!!deleteId}
        title="O‘chirish"
        destructive
        loading={remove.isLoading}
        onConfirm={async () => {
          if (deleteId) {
            try {
              await remove.mutate(deleteId);
            } catch (e) {
              Alert.alert('Xatolik', errorMessage(e));
            }
          }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  listContent: {padding: spacing.lg, gap: spacing.md, paddingBottom: 100},
  match: {color: colors.muted, fontSize: font.xs},
});
