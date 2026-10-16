import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient } from '@tc/api-client';
import { ApiProvider } from '@tc/core';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { env } from '../src/env';
import { supabase } from '../src/supabase';

const api = createApiClient({
  baseUrl: env.apiBaseUrl,
  getToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
});
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: '#c2410c' }}>
          <Stack.Screen name="index" options={{ title: 'Yatra Compare' }} />
          <Stack.Screen name="destination/[id]" options={{ title: '' }} />
          <Stack.Screen name="offers/[token]" options={{ title: 'Compare prices', presentation: 'modal' }} />
          <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          <Stack.Screen name="trips/index" options={{ title: 'My trips' }} />
          <Stack.Screen name="trips/[id]" options={{ title: 'Trip' }} />
        </Stack>
      </ApiProvider>
    </QueryClientProvider>
  );
}
