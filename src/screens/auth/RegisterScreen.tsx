import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useAppState} from '../../state/AppState';
import {errorMessage} from '../../lib/errors';
import {Button} from '../../components/ui/primitives';
import {Input} from '../../components/ui/form';
import {colors, font, spacing} from '../../theme';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({navigation}: Props) {
  const {register} = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password || !firstName.trim()) {
      setError('Email, parol va ismni kiriting.');
      return;
    }
    setLoading(true);
    try {
      await register({
        memberEmail: email.trim(),
        memberPassword: password,
        memberFirstName: firstName.trim(),
        memberLastName: lastName.trim() || undefined,
        memberPhone: phone.trim() || undefined,
        memberCompanyName: company.trim() || undefined,
      });
    } catch (err) {
      setError(errorMessage(err, 'Ro‘yxatdan o‘tib bo‘lmadi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ro‘yxatdan o‘tish</Text>
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
        <Input label="Parol" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <Input label="Ism" value={firstName} onChangeText={setFirstName} placeholder="Ism" />
        <Input label="Familiya" value={lastName} onChangeText={setLastName} placeholder="Familiya (ixtiyoriy)" />
        <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998…" />
        <Input label="Kompaniya" value={company} onChangeText={setCompany} placeholder="Kompaniya (ixtiyoriy)" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Ro‘yxatdan o‘tish" onPress={onSubmit} loading={loading} style={styles.button} />
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Hisobingiz bormi? Kirish</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.bg},
  container: {padding: spacing.xxl, paddingTop: 48},
  title: {fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.sm},
  error: {color: colors.danger, marginTop: spacing.lg},
  button: {marginTop: spacing.xxl},
  linkRow: {alignItems: 'center', paddingVertical: spacing.lg},
  linkText: {color: colors.primary, fontSize: font.sm, fontWeight: '600'},
});
