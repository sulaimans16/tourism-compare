import { formatDate, useTrips } from '@tc/core';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { supabase } from '../../src/supabase';
import { Button, Card, ErrorText, Loading, s } from '../../src/ui';

export default function Trips() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  const trips = useTrips(signedIn === true);

  if (signedIn === null) return <Loading />;
  if (!signedIn)
    return (
      <View style={[s.screen, s.pad]}>
        <Text>Sign in to see and save your trips.</Text>
        <Button title="Sign in" onPress={() => router.push('/login')} />
      </View>
    );
  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={trips.data ?? []}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={<>{trips.isLoading && <Loading />}{trips.error && <ErrorText error={trips.error} />}</>}
      ListEmptyComponent={trips.isLoading ? undefined : <Text style={s.muted}>No trips yet. Open a destination and plan one.</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/trips/[id]', params: { id: item.id } }} asChild>
          <Pressable>
            <Card>
              <Text style={{ fontWeight: '600' }}>{item.title}</Text>
              <Text style={s.muted}>{formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.status}</Text>
            </Card>
          </Pressable>
        </Link>
      )}
    />
  );
}
