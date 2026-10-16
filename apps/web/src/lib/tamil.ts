/** Tamil names for the launch destinations, shown alongside the English name. */
export const TAMIL_NAMES: Record<string, string> = {
  chennai: 'சென்னை',
  mahabalipuram: 'மாமல்லபுரம்',
  puducherry: 'புதுச்சேரி',
  ooty: 'உதகமண்டலம்',
  coonoor: 'குன்னூர்',
  kodaikanal: 'கொடைக்கானல்',
  yercaud: 'ஏற்காடு',
  yelagiri: 'ஏலகிரி',
  valparai: 'வால்பாறை',
  madurai: 'மதுரை',
  thanjavur: 'தஞ்சாவூர்',
  tiruchirappalli: 'திருச்சிராப்பள்ளி',
  rameswaram: 'இராமேஸ்வரம்',
  kanyakumari: 'கன்னியாகுமரி',
};

export const tamilName = (id: string) => TAMIL_NAMES[id] ?? null;
