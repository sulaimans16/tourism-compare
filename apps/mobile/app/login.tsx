import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { supabase } from '../src/supabase';
import { Button, s } from '../src/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={[s.screen, s.pad]}>
      <Text style={s.h2}>Sign in with an email code</Text>
      <TextInput style={s.input} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={email} onChangeText={setEmail} editable={!sent} />
      {sent && <TextInput style={s.input} keyboardType="number-pad" placeholder="6-digit code" value={code} onChangeText={setCode} />}
      <Button
        title={sent ? 'Verify' : 'Email me a code'}
        onPress={async () => {
          setError(null);
          if (!sent) {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) setError(error.message);
            else setSent(true);
          } else {
            const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
            if (error) setError(error.message);
            else router.replace('/trips');
          }
        }}
      />
      {error && <Text style={{ color: '#b91c1c' }}>{error}</Text>}
    </View>
  );
}
