// Benja's places — the source of truth for the /trips globe and the
// "countries visited" manifest beside it.
//
// `home: true` marks where Benja is based (Argentina); everything else is a
// country he's traveled to. Each entry needs a display `name` and a `location`
// of [latitude, longitude] (a representative point — usually the capital or the
// main city visited). `size` is optional and overrides the marker radius.

export interface Place {
  name: string;
  /** [latitude, longitude] of a representative point (capital or main city). */
  location: [number, number];
  /** Home base — rendered as a slightly larger marker, excluded from the visited count. */
  home?: boolean;
  /** Marker radius on the globe (cobe units). Optional; defaults applied in the page. */
  size?: number;
}

export const places: Place[] = [
  { name: 'Argentina', location: [-34.61, -58.38], home: true }, // Buenos Aires
  { name: 'Brazil', location: [-15.79, -47.88] }, // Brasília
  { name: 'Chile', location: [-33.45, -70.66] }, // Santiago
  { name: 'Uruguay', location: [-34.9, -56.16] }, // Montevideo
  { name: 'Mexico', location: [19.43, -99.13] }, // Mexico City
  { name: 'United States', location: [40.71, -74.01] }, // New York
  { name: 'Switzerland', location: [46.95, 7.45] }, // Bern
  { name: 'Poland', location: [52.23, 21.01] }, // Warsaw
  { name: 'Austria', location: [48.21, 16.37] }, // Vienna
  { name: 'Slovakia', location: [48.15, 17.11] }, // Bratislava
  { name: 'Czech Republic', location: [50.08, 14.44] }, // Prague
  { name: 'Spain', location: [40.42, -3.7] }, // Madrid
  { name: 'France', location: [48.85, 2.35] }, // Paris
  { name: 'Portugal', location: [38.72, -9.14] }, // Lisbon
  { name: 'Scotland', location: [55.95, -3.19] }, // Edinburgh
  { name: 'England', location: [51.51, -0.13] }, // London
  { name: 'China', location: [39.9, 116.4] }, // Beijing
  { name: 'Turkey', location: [41.01, 28.98] }, // Istanbul
  { name: 'Andorra', location: [42.51, 1.52] }, // Andorra la Vella
  { name: 'Hungary', location: [47.5, 19.04] }, // Budapest
  { name: 'Albania', location: [41.33, 19.82] }, // Tirana
  { name: 'Cyprus', location: [35.17, 33.36] }, // Nicosia
];
