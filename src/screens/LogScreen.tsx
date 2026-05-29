import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {clearLog, LogEntry, readLog} from '../storage/log';
import {colors} from '../theme';

function fmt(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function LogScreen({onBack}: {onBack: () => void}) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const refresh = useCallback(async () => {
    setEntries(await readLog());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onClear = async () => {
    await clearLog();
    await refresh();
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send log</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clear}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        onRefresh={refresh}
        refreshing={false}
        contentContainerStyle={entries.length === 0 && styles.emptyWrap}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.phone}>{item.phone}</Text>
              {item.failReason ? (
                <Text style={styles.reason}>{item.failReason}</Text>
              ) : null}
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.status,
                  {color: item.status === 'SENT' ? colors.success : colors.danger},
                ]}>
                {item.status}
              </Text>
              <Text style={styles.time}>{fmt(item.at)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  back: {color: colors.primary, fontSize: 16},
  title: {color: colors.text, fontSize: 18, fontWeight: '700'},
  clear: {color: colors.danger, fontSize: 15},
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {color: colors.muted, fontSize: 15},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: {flex: 1, paddingRight: 12},
  phone: {color: colors.text, fontSize: 15, fontWeight: '600'},
  reason: {color: colors.muted, fontSize: 12, marginTop: 2},
  rowRight: {alignItems: 'flex-end'},
  status: {fontSize: 13, fontWeight: '700'},
  time: {color: colors.muted, fontSize: 12, marginTop: 2},
});
