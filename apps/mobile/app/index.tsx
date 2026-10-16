import { useApi, useDestinations } from '@tc/core';
import { Link, router } from 'expo-router';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Button, ErrorText, Loading, s } from '../src/ui';

export default function Home() {
  const api = useApi();
  const { data, isLoading, error, refetch } = useDestinations();
  if (isLoading) return <Loading />;
  if (error) return <View style={s.pad}><ErrorText error={error} onRetry={refetch} /></View>;
  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={data}
      keyExtractor={(d) => d.id}
      ListHeaderComponent={
        <View style={{ gap: 8, marginBottom: 8 }}>
          <Text style={s.h1}>Plan Tamil Nadu</Text>
          <Text style={s.muted}>Compare live stay prices across platforms and contact local agencies.</Text>
          <Button variant="outline" title="My trips" onPress={() => router.push('/trips')} />
        </View>
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: '/destination/[id]', params: { id: item.id } }} asChild>
          <Pressable style={[s.card, { padding: 0, overflow: 'hidden' }]}>
            <Image source={{ uri: api.destinations.photoUrl(item.id) }} style={{ height: 140, backgroundColor: '#e7e5e4' }} />
            <View style={{ padding: 12 }}>
              <Text style={s.h2}>{item.name}</Text>
              <Text style={s.muted}>{item.region} · {item.state}</Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}
