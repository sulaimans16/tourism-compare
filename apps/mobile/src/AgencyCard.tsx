import type { Agency } from '@tc/types';
import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';
import { Button, Card, s } from './ui';

export function AgencyCard({ a }: { a: Agency }) {
  return (
    <Card>
      <Text style={{ fontWeight: '600' }}>{a.name}</Text>
      {a.address && <Text style={s.muted}>{a.address}</Text>}
      {a.rating != null && <Text style={s.muted}>★ {a.rating.toFixed(1)} ({a.userRatingCount ?? 0} reviews)</Text>}
      <View style={[s.row, { marginTop: 8, flexWrap: 'wrap' }]}>
        {a.phone && <Button title={`Call ${a.phone}`} onPress={() => Linking.openURL(`tel:${(a.internationalPhone ?? a.phone!).replace(/\s/g, '')}`)} />}
        {a.whatsappUrl && <Button variant="outline" title="WhatsApp" onPress={() => Linking.openURL(a.whatsappUrl!)} />}
        {a.website && <Button variant="outline" title="Website" onPress={() => Linking.openURL(a.websiteRedirectUrl ?? a.website!)} />}
      </View>
    </Card>
  );
}
