import React, {useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useInfiniteList} from '../../api/useInfiniteList';
import {useMutation, useQuery} from '../../api/queryClient';
import {Contact, ContactGroup, ContactStatus} from '../../api/types';
import {Button, EmptyState, ErrorState, LoadingState, StatusPill} from '../../components/ui/primitives';
import {AddFab, ListRow, SearchInput} from '../../components/ui/layout';
import {AppModal, ConfirmDialog} from '../../components/ui/AppModal';
import {Input, Select, TagInput} from '../../components/ui/form';
import {contactStatusLabel, contactStatusTone} from '../../lib/labels';
import {useDebouncedValue} from '../../lib/useDebouncedValue';
import {errorMessage} from '../../lib/errors';
import {colors, font, spacing} from '../../theme';
import type {ContactsStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<ContactsStackParamList, 'ContactsList'>;

const STATUS_OPTIONS: {value: ContactStatus; label: string}[] = [
  {value: 'ACTIVE', label: contactStatusLabel.ACTIVE},
  {value: 'ARCHIVED', label: contactStatusLabel.ARCHIVED},
];

export default function ContactsScreen({navigation}: Props) {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const list = useInfiniteList<Contact>((c, p) => c.getContacts(p), {
    search: search ? {phone: search, name: search} : undefined,
    tags: ['Contact'],
  });
  const groups = useQuery<ContactGroup[]>(c => c.getContactGroups(), {tags: ['ContactGroup']});

  const create = useMutation((c, b: any) => c.createContact(b), {invalidates: ['Contact']});
  const update = useMutation((c, a: {id: string; data: any}) => c.updateContact(a.id, a.data), {invalidates: ['Contact']});
  const remove = useMutation((c, id: string) => c.deleteContact(id), {invalidates: ['Contact']});

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ContactStatus>('ACTIVE');
  const [tags, setTags] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setStatus('ACTIVE');
    setTags([]);
    setGroupIds([]);
    setShowForm(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setName(c.name ?? '');
    setPhone(c.phone);
    setStatus(c.status);
    setTags(c.tags ?? []);
    setGroupIds(c.groupIds ?? []);
    setShowForm(true);
  };

  const onSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('Telefon kerak', 'Telefon raqamini kiriting.');
      return;
    }
    const data = {name: name.trim() || undefined, phone: phone.trim(), status, tags, groupIds};
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

  const toggleGroup = (id: string) =>
    setGroupIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  if (list.isLoading) {
    return <LoadingState />;
  }
  if (list.error && !list.items.length) {
    return <ErrorState message={errorMessage(list.error)} onRetry={list.refresh} />;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.head}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Ism yoki raqam…" />
        <TouchableOpacity onPress={() => navigation.navigate('ContactGroups')}>
          <Text style={styles.groupsLink}>Guruhlar →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list.items}
        keyExtractor={x => x._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={colors.muted} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyState title="Kontakt yo‘q" hint="Birinchi kontaktni qo‘shing." action={<Button title="Kontakt qo‘shish" onPress={openCreate} />} />}
        renderItem={({item}) => (
          <ListRow
            title={item.name || item.phone}
            subtitle={item.name ? item.phone : undefined}
            onPress={() => openEdit(item)}
            trailing={<StatusPill label={contactStatusLabel[item.status]} tone={contactStatusTone[item.status]} />}
          />
        )}
      />

      <AddFab onPress={openCreate} />

      <AppModal visible={showForm} title={editing ? 'Kontaktni tahrirlash' : 'Kontakt qo‘shish'} onClose={() => setShowForm(false)}>
        <Input label="Ism" value={name} onChangeText={setName} placeholder="Ism (ixtiyoriy)" />
        <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998…" />
        <Select label="Holat" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <TagInput label="Teglar" tags={tags} onChange={setTags} />
        {groups.data && groups.data.length ? (
          <View style={styles.groupsWrap}>
            <Text style={styles.groupsLabel}>Guruhlar</Text>
            <View style={styles.chips}>
              {groups.data.map(g => (
                <TouchableOpacity
                  key={g._id}
                  style={[styles.chip, groupIds.includes(g._id) && styles.chipOn]}
                  onPress={() => toggleGroup(g._id)}>
                  <Text style={[styles.chipText, groupIds.includes(g._id) && styles.chipTextOn]}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        <Button title="Saqlash" onPress={onSubmit} loading={create.isLoading || update.isLoading} style={{marginTop: spacing.xl}} />
        {editing ? (
          <Button title="O‘chirish" variant="ghost" onPress={() => {setShowForm(false); setDeleteId(editing._id);}} style={{marginTop: spacing.sm}} />
        ) : null}
      </AppModal>

      <ConfirmDialog
        visible={!!deleteId}
        title="Kontaktni o‘chirish"
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
  head: {padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm},
  groupsLink: {color: colors.primary, fontSize: font.sm, fontWeight: '600', alignSelf: 'flex-end'},
  listContent: {padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 100},
  groupsWrap: {marginTop: spacing.lg},
  groupsLabel: {color: colors.muted, fontSize: font.sm, marginBottom: 6},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6},
  chipOn: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {color: colors.muted, fontSize: font.sm},
  chipTextOn: {color: '#fff', fontWeight: '600'},
});
