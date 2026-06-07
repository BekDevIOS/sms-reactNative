import React from 'react';
import {StyleSheet, View} from 'react-native';
import {EmptyState} from '../../components/ui/primitives';
import {colors} from '../../theme';

export default function UssdScreen() {
  return (
    <View style={styles.flex}>
      <EmptyState
        title="USSD — tez orada"
        hint="USSD funksiyasi hali tayyorlanmoqda. Backend qo‘shilgach faollashtiriladi."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg, justifyContent: 'center'},
});
