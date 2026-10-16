import { addDays, formatInr, useAttractions, useCreateTrip, useDestinationAgencies, useStaySearch } from '@tc/core';
import type { StayType } from '@tc/types';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { AgencyCard } from '../../src/AgencyCard';
import { supabase } from '../../src/supabase';
import { Button, Card, ErrorText, Loading, Segmented, s } from '../../src/ui';

type Tab = 'todo' | 'stays' | 'agencies';
const today = () => new Date().toISOString().slice(0, 10);

export default function DestinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('todo');
  const [checkIn, setCheckIn] = useState(addDays(today(), 14));
  const [checkOut, setCheckOut] = useState(addDays(today(), 16));
  const [type, setType] = useState<StayType>('hotel');
  const attractions = useAttractions(tab === 'todo' ? id : undefined);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(checkIn) && /^\d{4}-\d{2}-\d{2}$/.test(checkOut) && checkOut > checkIn;
  const stays = useStaySearch(tab === 'stays' && valid ? { destination: id, checkIn, checkOut, adults: 2, children: 0, type, sort: 'lowest_price' } : null);
  const agencies = useDestinationAgencies(tab === 'agencies' ? id : undefined);
  const createTrip = useCreateTrip();

  const planTrip = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return router.push('/login');
    const trip = await createTrip.mutateAsync({ title: `${id} trip`, startDate: checkIn, endDate: addDays(checkOut, -1), adults: 2, children: 0, destinationIds: [id] });
    router.push({ pathname: '/trips/[id]', params: { id: trip.id } });
  };

  const header = (
    <View style={{ gap: 10, marginBottom: 8 }}>
      <Stack.Screen options={{ title: id.charAt(0).toUpperCase() + id.slice(1) }} />
      <Segmented<Tab> value={tab} onChange={setTab} options={[{ id: 'todo', label: 'Things to do' }, { id: 'stays', label: 'Stays' }, { id: 'agencies', label: 'Agencies' }]} />
      {tab === 'stays' && (
        <Card style={{ gap: 8 }}>
          <View style={s.row}>
            <TextInput style={[s.input, { flex: 1 }]} value={checkIn} onChangeText={setCheckIn} placeholder="Check-in YYYY-MM-DD" />
            <TextInput style={[s.input, { flex: 1 }]} value={checkOut} onChangeText={setCheckOut} placeholder="Check-out YYYY-MM-DD" />
          </View>
          <Segmented<StayType> value={type} onChange={setType} options={[{ id: 'hotel', label: 'Hotels' }, { id: 'villa', label: 'Villas' }]} />
          <Button variant="outline" title="Plan a trip for these dates" onPress={planTrip} disabled={!valid || createTrip.isPending} />
        </Card>
      )}
    </View>
  );

  if (tab === 'todo') {
    return (
      <FlatList
        style={s.screen}
        contentContainerStyle={s.pad}
        ListHeaderComponent={<>{header}{attractions.isLoading && <Loading />}{attractions.error && <ErrorText error={attractions.error} />}</>}
        data={attractions.data?.places ?? []}
        keyExtractor={(p) => p.placeId}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', gap: 10 }}>
            {item.photoUrl && <Image source={{ uri: item.photoUrl }} style={{ width: 64, height: 64, borderRadius: 8 }} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              {item.rating != null && <Text style={s.muted}>★ {item.rating} ({item.userRatingCount})</Text>}
            </View>
          </Card>
        )}
      />
    );
  }

  if (tab === 'stays') {
    return (
      <FlatList
        style={s.screen}
        contentContainerStyle={s.pad}
        ListHeaderComponent={<>{header}{stays.isLoading && <Loading label="Fetching live prices…" />}{stays.error && <ErrorText error={stays.error} onRetry={stays.refetch} />}</>}
        data={stays.data?.properties ?? []}
        keyExtractor={(p) => p.propertyToken}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/offers/[token]', params: { token: item.propertyToken, destination: id, checkIn, checkOut, type, name: item.name } })}
          >
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {item.images[0] && <Image source={{ uri: item.images[0] }} style={{ height: 140 }} />}
              <View style={{ padding: 12 }}>
                <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                <Text style={s.muted}>{item.rating != null ? `★ ${item.rating} · ` : ''}from {formatInr(item.lowestNightlyInr)}/night</Text>
                <Text style={{ color: '#c2410c', marginTop: 4 }}>Compare prices →</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    );
  }

  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      ListHeaderComponent={<>{header}{agencies.isLoading && <Loading />}{agencies.error && <ErrorText error={agencies.error} />}</>}
      data={agencies.data?.agencies ?? []}
      keyExtractor={(a) => a.placeId}
      renderItem={({ item }) => <AgencyCard a={item} />}
    />
  );
}
