import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useMutation, useQuery} from '../../api/queryClient';
import {ContactGroup} from '../../api/types';
import {Button, EmptyState, ErrorState, LoadingState} from '../../components/ui/primitives';
import {AddFab, ListRow} from '../../components/ui/layout';
import {AppModal, ConfirmDialog} from '../../components/ui/AppModal';
import {Input} from '../../components/ui/form';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';

export default function ContactGroupsScreen() {
  const groups = useQuery<ContactGroup[]>(c => c.getContactGroups(), {tags: ['ContactGroup']});
  const create = useMutation((c, b: any) => c.createContactGroup(b), {invalidates: ['ContactGroup']});
  const update = useMutation((c, a: {id: string; data: any}) => c.updateContactGroup(a.id, a.data), {invalidates: ['ContactGroup']});
  const remove = useMutation((c, id: string) => c.deleteContactGroup(id), {invalidates: ['ContactGroup', 'Contact']});

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setShowForm(true);
  };
  const openEdit = (g: ContactGroup) => {
    setEditing(g);
    setName(g.name);
    setDescription(g.description ?? '');
    setShowForm(true);
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nom kerak', 'Guruh nomini kiriting.');
      return;
    }
    const data = {name: name.trim(), description: description.trim() || undefined};
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

  if (groups.isLoading) {
    return <LoadingState />;
  }
  if (groups.error && !groups.data) {
    return <ErrorState message={errorMessage(groups.error)} onRetry={groups.refetch} />;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={groups.data ?? []}
        keyExtractor={x => x._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={groups.refetch} tintColor={colors.muted} />}
        ListEmptyComponent={<EmptyState title="Guruh yo‘q" hint="Kontaktlarni guruhlash uchun guruh yarating." action={<Button title="Guruh qo‘shish" onPress={openCreate} />} />}
        renderItem={({item}) => (
          <ListRow
            title={item.name}
            subtitle={item.description || `${item.count ?? 0} ta kontakt`}
            onPress={() => openEdit(item)}
            trailing={<Text style={styles.del} onPress={() => setDeleteId(item._id)}>O‘chirish</Text>}
          />
        )}
      />

      <AddFab onPress={openCreate} />

      <AppModal visible={showForm} title={editing ? 'Guruhni tahrirlash' : 'Guruh qo‘shish'} onClose={() => setShowForm(false)}>
        <Input label="Nom" value={name} onChangeText={setName} placeholder="Guruh nomi" />
        <Input label="Tavsif" value={description} onChangeText={setDescription} placeholder="Ixtiyoriy" multiline />
        <Button title="Saqlash" onPress={onSubmit} loading={create.isLoading || update.isLoading} style={{marginTop: spacing.xl}} />
      </AppModal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Guruhni o‘chirish"
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
