import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export const colors = { brand: '#c2410c', ink: '#1c1917', muted: '#78716c', line: '#e7e5e4', bg: '#fafaf9', green: '#166534', greenBg: '#dcfce7' };

export function Button({ title, onPress, variant = 'primary', disabled, style }: { title: string; onPress: () => void; variant?: 'primary' | 'outline'; disabled?: boolean; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, variant === 'outline' ? s.btnOutline : s.btnPrimary, (pressed || disabled) && { opacity: 0.6 }, style]}
    >
      <Text style={variant === 'outline' ? s.btnOutlineText : s.btnText}>{title}</Text>
    </Pressable>
  );
}

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.card, style]}>{children}</View>;

export const Loading = ({ label }: { label?: string }) => (
  <View style={s.center}><ActivityIndicator color={colors.brand} /><Text style={s.muted}>{label ?? 'Loading…'}</Text></View>
);

export const ErrorText = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => (
  <View style={[s.card, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
    <Text style={{ color: '#991b1b' }}>{(error as Error)?.message ?? 'Something went wrong'}</Text>
    {onRetry && <Button title="Retry" variant="outline" onPress={onRetry} style={{ marginTop: 8 }} />}
  </View>
);

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <Pressable key={o.id} onPress={() => onChange(o.id)} style={[s.segItem, value === o.id && s.segActive]}>
          <Text style={{ fontWeight: value === o.id ? '600' : '400' }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.ink },
  h2: { fontSize: 18, fontWeight: '600', color: colors.ink },
  muted: { color: colors.muted, fontSize: 13 },
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  center: { padding: 24, alignItems: 'center', gap: 8 },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.brand },
  btnOutline: { borderWidth: 1, borderColor: colors.line, backgroundColor: 'white' },
  btnText: { color: 'white', fontWeight: '600' },
  btnOutlineText: { color: colors.ink, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 10, backgroundColor: 'white' },
  seg: { flexDirection: 'row', backgroundColor: '#f5f5f4', borderRadius: 10, padding: 4 },
  segItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segActive: { backgroundColor: 'white' },
  badge: { backgroundColor: colors.greenBg, color: colors.green, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, fontSize: 12, overflow: 'hidden' },
});
