import { formatInr, freshness, useStayOffers } from '@tc/core';
import type { StayType } from '@tc/types';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { Button, Card, ErrorText, Loading, colors, s } from '../../src/ui';

export default function OffersScreen() {
  const p = useLocalSearchParams<{ token: string; destination: string; checkIn: string; checkOut: string; type: StayType; name: string; tripId?: string }>();
  const { data, isLoading, error, refetch } = useStayOffers(p.token, {
    destination: p.destination,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    adults: 2,
    children: 0,
    type: p.type ?? 'hotel',
    tripId: p.tripId,
  });

  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={data?.offers ?? []}
      keyExtractor={(o) => o.platform}
      ListHeaderComponent={
        <View style={{ gap: 8 }}>
          <Stack.Screen options={{ title: p.name ?? 'Compare prices' }} />
          {isLoading && <Loading label="Comparing every platform live…" />}
          {error && <ErrorText error={error} onRetry={refetch} />}
          {data?.cheapest && (
            <Card style={{ backgroundColor: colors.greenBg, borderColor: '#bbf7d0' }}>
              <Text style={{ color: colors.green, fontWeight: '600' }}>Lowest price</Text>
              <Text style={s.h1}>{formatInr(data.cheapest.totalInr)}</Text>
              <Text>on {data.cheapest.platform} · {data.nights} nights · fetched {freshness(data.fetchedAt)}</Text>
              <Button title={`Go to ${data.cheapest.platform}`} style={{ marginTop: 8 }} onPress={() => Linking.openURL(data.cheapest!.redirectUrl ?? data.cheapest!.deepLink)} />
            </Card>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>{item.platform}{item.official ? ' · official' : ''}</Text>
            <Text style={s.muted}>{formatInr(item.nightlyInr)}/night · {formatInr(item.totalInr)} total{item.freeCancellation ? ' · free cancellation' : ''}</Text>
          </View>
          <Button variant={item.cheapest ? 'primary' : 'outline'} title="Go" onPress={() => Linking.openURL(item.redirectUrl ?? item.deepLink)} />
        </Card>
      )}
    />
  );
}
