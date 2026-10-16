import { formatDate, formatInr, useTrip, useTripAgencies } from '@tc/core';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AgencyCard } from '../../src/AgencyCard';
import { Button, Card, ErrorText, Loading, s } from '../../src/ui';

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const agencies = useTripAgencies(id);
  if (trip.isLoading) return <Loading />;
  if (trip.error || !trip.data) return <View style={s.pad}><ErrorText error={trip.error} onRetry={trip.refetch} /></View>;
  const t = trip.data;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <Stack.Screen options={{ title: t.title }} />
      <Text style={s.muted}>{formatDate(t.startDate)} – {formatDate(t.endDate)} · {t.adults + t.children} travellers</Text>
      {t.days.map((d, i) => (
        <Card key={d.id}>
          <Text style={{ fontWeight: '600' }}>Day {i + 1} · {formatDate(d.dayDate)} · {d.destinationId}</Text>
          {d.items.length === 0 ? <Text style={s.muted}>Free day (add places on the web planner)</Text> : d.items.map((it) => <Text key={it.id}>• {it.title}</Text>)}
        </Card>
      ))}
      {t.stays.length > 0 && <Text style={s.h2}>Stays</Text>}
      {t.stays.map((st) => (
        <Card key={st.id}>
          <Text style={{ fontWeight: '600' }}>{st.name}</Text>
          <Text style={s.muted}>{st.checkIn} → {st.checkOut}{st.chosenPlatform ? ` · ${formatInr(st.priceAtSaveInr)} on ${st.chosenPlatform}` : ''}</Text>
          {st.deepLink && <Button title={`Book on ${st.chosenPlatform ?? 'site'}`} style={{ marginTop: 8 }} onPress={() => Linking.openURL(st.deepLink!)} />}
        </Card>
      ))}
      <Text style={s.h2}>Agencies for this trip</Text>
      {agencies.isLoading && <Loading />}
      {agencies.error && <ErrorText error={agencies.error} />}
      {agencies.data?.destinations.map((g) => (
        <View key={g.destinationId} style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600' }}>{g.destinationName}</Text>
          {g.agencies.map((a) => <AgencyCard key={a.placeId} a={a} />)}
        </View>
      ))}
    </ScrollView>
  );
}
