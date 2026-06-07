import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, font, radius, spacing} from '../../theme';

export function FieldLabel({children}: {children: React.ReactNode}) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'sentences',
  multiline,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Tanlang',
}: {
  label?: string;
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={current ? styles.selectValue : styles.selectPlaceholder}>
          {current ? current.label : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView>
              {options.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={styles.option}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}>
                  <Text
                    style={[styles.optionText, o.value === value && styles.optionTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: colors.border, true: colors.primary}}
        thumbColor="#fff"
      />
    </View>
  );
}

export function TagInput({
  label,
  tags,
  onChange,
  placeholder = 'Qo‘shish uchun yozing va Enter bosing',
}: {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setText('');
  };
  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={styles.tagsWrap}>
        {tags.map(t => (
          <TouchableOpacity
            key={t}
            style={styles.tag}
            onPress={() => onChange(tags.filter(x => x !== t))}>
            <Text style={styles.tagText}>{t} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onSubmitEditing={add}
        blurOnSubmit={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {marginTop: spacing.lg},
  label: {fontSize: font.sm, color: colors.muted, marginBottom: 6},
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  textarea: {minHeight: 100, paddingTop: 12},
  selectValue: {color: colors.text, fontSize: font.md},
  selectPlaceholder: {color: colors.muted, fontSize: font.md},
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xxl},
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {paddingVertical: 14, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border},
  optionText: {color: colors.text, fontSize: font.md},
  optionTextActive: {color: colors.primary, fontWeight: '700'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  switchLabel: {color: colors.text, fontSize: font.md},
  tagsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm},
  tag: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {color: colors.primary, fontSize: font.xs, fontWeight: '600'},
});
