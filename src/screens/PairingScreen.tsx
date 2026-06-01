import React, {useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {InvalidCodeError} from '../api/client';
import {useAppState} from '../state/AppState';
import {colors} from '../theme';

export default function PairingScreen() {
  const {baseUrl, setBaseUrl, selectDevice} = useAppState();
  const [code, setCode] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = async () => {
    const value = code.trim().toUpperCase();
    if (!value) {
      setError('Web paneldagi juftlash kodini kiriting.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await selectDevice(value);
    } catch (err) {
      setError(err instanceof InvalidCodeError ? 'Kod noto‘g‘ri yoki ishlatilgan.' : 'Server bilan bog‘lanib bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>SMS Sender</Text>
        <Text style={styles.subtitle}>Web paneldan olingan bir martalik kod bilan qurilmani ulang.</Text>

        <Text style={styles.label}>Juftlash kodi</Text>
        <TextInput
          style={styles.code}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="ABC23XYZ"
          placeholderTextColor={colors.muted}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, loading && styles.dim]} onPress={pair} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Qurilmani ulash</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setAdvanced(value => !value)}>
          <Text style={styles.advanced}>{advanced ? 'Advanced sozlamalarni yopish' : 'Advanced sozlamalar'}</Text>
        </TouchableOpacity>
        {advanced ? (
          <>
            <Text style={styles.label}>Backend URL</Text>
            <TextInput
              style={styles.input}
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://api.example.uz"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.hint}>Production’da bu qiymat build konfiguratsiyasidan avtomatik olinadi.</Text>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: 24, paddingTop: 80},
  title: {fontSize: 30, fontWeight: '700', color: colors.text},
  subtitle: {fontSize: 15, color: colors.muted, marginTop: 8, marginBottom: 28, lineHeight: 21},
  label: {fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 16},
  code: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 3,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {color: colors.danger, marginTop: 16},
  button: {backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  advanced: {color: colors.primary, fontSize: 13, textAlign: 'center', marginTop: 28},
  hint: {color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18},
  dim: {opacity: 0.6},
});
