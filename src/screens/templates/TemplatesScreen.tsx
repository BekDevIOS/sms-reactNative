import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useInfiniteList} from '../../api/useInfiniteList';
import {useMutation} from '../../api/queryClient';
import {Template} from '../../api/types';
import {Button, EmptyState, ErrorState, LoadingState} from '../../components/ui/primitives';
import {AddFab, ListRow} from '../../components/ui/layout';
import {AppModal, ConfirmDialog} from '../../components/ui/AppModal';
import {Input} from '../../components/ui/form';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function TemplatesScreen() {
  const list = useInfiniteList<Template>((c, p) => c.getTemplates(p), {tags: ['Template']});
  const create = useMutation((c, b: {name: string; body: string}) => c.createTemplate(b), {invalidates: ['Template']});
  const update = useMutation((c, a: {id: string; name: string; body: string}) => c.updateTemplate(a.id, {name: a.name, body: a.body}), {invalidates: ['Template']});
  const remove = useMutation((c, id: string) => c.deleteTemplate(id), {invalidates: ['Template']});

  const [editing, setEditing] = useState<Template | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setBody('');
    setShowForm(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setName(t.name);
    setBody(t.body);
    setShowForm(true);
  };

  const onSubmit = async () => {
    if (!name.trim() || !body.trim()) {
      Alert.alert('To‘ldiring', 'Nom va matn kiritilishi shart.');
      return;
    }
    try {
      if (editing) {
        await update.mutate({id: editing._id, name: name.trim(), body: body.trim()});
      } else {
        await create.mutate({name: name.trim(), body: body.trim()});
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
        ListEmptyComponent={
          <EmptyState title="Shablon yo‘q" hint="Tez-tez ishlatiladigan matnlar uchun shablon yarating." action={<Button title="Shablon qo‘shish" onPress={openCreate} />} />
        }
        renderItem={({item}) => (
          <ListRow
            title={item.name}
            subtitle={item.body}
            onPress={() => openEdit(item)}
            trailing={<Text style={styles.del} onPress={() => setDeleteId(item._id)}>O‘chirish</Text>}
          />
        )}
      />

      <AddFab onPress={openCreate} />

      <AppModal visible={showForm} title={editing ? 'Shablonni tahrirlash' : 'Shablon qo‘shish'} onClose={() => setShowForm(false)}>
        <Input label="Nom" value={name} onChangeText={setName} placeholder="Shablon nomi" />
        <Input label="Matn" value={body} onChangeText={setBody} placeholder="Xabar matni" multiline />
        <Button title="Saqlash" onPress={onSubmit} loading={create.isLoading || update.isLoading} style={{marginTop: spacing.xl}} />
      </AppModal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Shablonni o‘chirish"
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
  del: {color: colors.danger, fontSize: font.sm, fontWeight: '600'},
});
