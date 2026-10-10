import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation, useQuery} from '../../api/queryClient';
import {Campaign, CampaignDetail, ContactGroup, Device, ListResponse, Template} from '../../api/types';
import {Button, SectionTitle} from '../../components/ui/primitives';
import {Input} from '../../components/ui/form';
import {errorMessage} from '../../lib/errors';
import {smsLength} from '../../lib/sms';
import {useAppState} from '../../state/AppState';
import {colors, font, spacing} from '../../theme';
import type {CampaignsStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<CampaignsStackParamList, 'CampaignCreate'>;

export default function CampaignCreateScreen({navigation}: Props) {
  const {config} = useAppState();
  const groups = useQuery<ContactGroup[]>(c => c.getContactGroups(), {tags: ['ContactGroup']});
  const devices = useQuery<ListResponse<Device>>(c => c.getDevices(), {tags: ['Device']});
  const templates = useQuery<ListResponse<Template>>(c => c.getTemplates({page: 1, limit: 50}), {tags: ['Template']});
  const create = useMutation((c, body: any) => c.createCampaign(body), {invalidates: ['Campaign', 'Stats']});

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [phonesText, setPhonesText] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);

  const senderDevices = useMemo(
    () => (devices.data?.list ?? []).filter(device => device.status !== 'BLOCKED' && device.pairedAt),
    [devices.data],
  );
  const senderDevice = senderDevices[0];
  const sms = useMemo(() => smsLength(message), [message]);

  const toggleGroup = (id: string) =>
    setGroupIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const parsePhones = (): string[] =>
    phonesText
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

  const send = async () => {
    const phones = parsePhones();
    if (!title.trim() || !message.trim()) {
      Alert.alert('To‘ldiring', 'Sarlavha va matn shart.');
      return;
    }
    if (!phones.length && !groupIds.length) {
      Alert.alert('Qabul qiluvchi yo‘q', 'Telefon raqamlari yoki guruh tanlang.');
      return;
    }
    if (!config || !senderDevice) {
      Alert.alert('Telefon ulanmagan', 'Avval bu telefonni TezkorSMS hisobiga ulang.');
      return;
    }
    try {
      const res = (await create.mutate({
        title: title.trim(),
        message: message.trim(),
        phones: phones.length ? phones : undefined,
        groupIds: groupIds.length ? groupIds : undefined,
        sendNow: true,
      })) as CampaignDetail | Campaign;
      navigation.replace('CampaignDetail', {id: res._id});
    } catch (e) {
      Alert.alert('Xatolik', errorMessage(e));
    }
  };

  const onSubmit = () => {
    const recipientCount = parsePhones().length + groupIds.reduce(
      (sum, id) => sum + (groups.data?.find(g => g._id === id)?.count ?? 0),
      0,
    );
    if (!title.trim() || !message.trim() || recipientCount === 0 || !config || !senderDevice) {
      send();
      return;
    }
    Alert.alert(
      'Yuborishni tasdiqlang',
      `${recipientCount} tagacha qabul qiluvchi\n${sms.segments} segmentdan · taxminan ${recipientCount * sms.segments} SMS\n${config.selectedSimCarrier ?? 'SIM tanlanmagan'}`,
      [
        {text: 'Orqaga', style: 'cancel'},
        {text: 'Navbatga qo‘shish', onPress: send},
      ],
    );
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Input label="Sarlavha" value={title} onChangeText={setTitle} placeholder="Kampaniya nomi" />
      <Input label="Xabar matni" value={message} onChangeText={setMessage} placeholder="SMS matni" multiline />
      <Text style={styles.smsMeta}>{sms.encoding} · {sms.segments} SMS segment · {sms.remaining} belgi qoldi</Text>

      <View style={styles.senderCard}>
        <Text style={styles.senderTitle}>{senderDevice?.name ?? 'Yuboruvchi telefon ulanmagan'}</Text>
        <Text style={styles.smsMeta}>
          {senderDevice
            ? `${senderDevice.status === 'ONLINE' ? 'Onlayn' : 'Oflayn'} · ${config?.selectedSimCarrier ?? 'SIM tanlanmagan'}`
            : 'Telefon bo‘limidan ushbu telefonni ulang.'}
        </Text>
      </View>

      {templates.data && templates.data.list.length ? (
        <View style={styles.templates}>
          <Text style={styles.tplLabel}>Shablondan tanlash:</Text>
          <View style={styles.chips}>
            {templates.data.list.map(t => (
              <TouchableOpacity key={t._id} style={styles.chip} onPress={() => setMessage(t.body)}>
                <Text style={styles.chipText}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Input
        label="Telefon raqamlari (vergul yoki yangi qator bilan)"
        value={phonesText}
        onChangeText={setPhonesText}
        placeholder="+998901234567, +998901234568"
        multiline
        autoCapitalize="none"
      />

      {groups.data && groups.data.length ? (
        <View style={styles.groupsWrap}>
          <SectionTitle>Guruhlar</SectionTitle>
          <View style={styles.chips}>
            {groups.data.map(g => (
              <TouchableOpacity
                key={g._id}
                style={[styles.chip, groupIds.includes(g._id) && styles.chipOn]}
                onPress={() => toggleGroup(g._id)}>
                <Text style={[styles.chipText, groupIds.includes(g._id) && styles.chipTextOn]}>
                  {g.name} ({g.count ?? 0})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <Button
        title={`${parsePhones().length + groupIds.reduce((sum, id) => sum + (groups.data?.find(g => g._id === id)?.count ?? 0), 0)} kishiga yuborish`}
        onPress={onSubmit}
        loading={create.isLoading}
        style={{marginTop: spacing.xl}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.lg, paddingBottom: 60},
  senderCard: {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.lg, marginTop: spacing.lg},
  senderTitle: {color: colors.text, fontSize: font.md, fontWeight: '700'},
  templates: {marginTop: spacing.md},
  tplLabel: {color: colors.muted, fontSize: font.sm, marginBottom: 6},
  smsMeta: {color: colors.muted, fontSize: font.xs, marginTop: spacing.sm},
  groupsWrap: {marginTop: spacing.sm},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6},
  chipOn: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {color: colors.muted, fontSize: font.sm},
  chipTextOn: {color: '#fff', fontWeight: '600'},
});
