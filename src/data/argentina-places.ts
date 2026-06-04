// Places Benja has been to *inside* Argentina — the source of truth for the
// Argentina map on /trips and its manifest.
//
// `role` marks the two anchors: 'hometown' is where he's from (Colón, Entre
// Ríos) and 'live' is where he lives now (Buenos Aires / CABA). Both render as
// distinct markers. Everything else is a place he's traveled to. Each entry
// needs a display `name` and a `location` of [latitude, longitude].

export interface ArgPlace {
  name: string;
  /** [latitude, longitude]. */
  location: [number, number];
  /** Anchor role: hometown (from) or current residence (live). Regular spots omit it. */
  role?: 'hometown' | 'live';
}

export const argentinaPlaces: ArgPlace[] = [
  { name: 'Colón, Entre Ríos', location: [-32.22, -58.14], role: 'hometown' },
  { name: 'Buenos Aires', location: [-34.61, -58.38], role: 'live' },
  { name: 'Iguazú', location: [-25.6, -54.57] }, // Puerto Iguazú
  { name: 'Mendoza', location: [-32.89, -68.84] },
  { name: 'Las Leñas', location: [-35.15, -70.08] },
  { name: 'Salta', location: [-24.79, -65.41] },
  { name: 'La Pampa', location: [-36.62, -64.29] }, // Santa Rosa
  { name: 'Bariloche', location: [-41.13, -71.31] },
  { name: 'El Bolsón', location: [-41.96, -71.53] },
  { name: 'Rosario', location: [-32.95, -60.64] },
  { name: 'Mar del Plata', location: [-38.0, -57.55] },
  { name: 'Pinamar', location: [-37.11, -56.86] },
];
