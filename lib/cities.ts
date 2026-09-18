import citiesData from "@/data/cities.json";

export interface City {
  id: string;
  name: string;
  aliases: string[];
  province: string;
  population: number;
  populationSource: string;
  populationDate: string;
  latitude: number;
  longitude: number;
  image: {
    url: string;
    source: string;
    owner: string;
    license: string;
  };
  wikipedia: string;
}

interface RawCity {
  name: string;
  aliases: string[];
  province: string;
  population: number;
  populationSource: string;
  populationDate: string;
  latitude: number;
  longitude: number;
  image: City["image"];
  wikipedia: string;
}

// Stable, deterministic id derived from the display name — ASCII/kebab-case (data-model.md).
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadCities(): City[] {
  const raw = citiesData as RawCity[];
  return raw.map((c) => ({ ...c, id: slugify(c.name) }));
}

let citiesCache: City[] | null = null;

export function getCities(): City[] {
  if (!citiesCache) {
    citiesCache = loadCities();
  }
  return citiesCache;
}

export function getCityById(id: string): City | undefined {
  return getCities().find((c) => c.id === id);
}

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface NormalizedCity {
  city: City;
  normalizedName: string;
  normalizedAliases: string[];
}

let normalizedCache: NormalizedCity[] | null = null;

// Precomputes normalize() once per city/alias instead of on every searchCities()/resolveCity()
// call — normalize() does Unicode NFKD + a regex pass, which is wasted work to repeat on every
// keystroke of an autocomplete input. Lazily built and cached alongside `citiesCache`.
function getNormalizedCities(): NormalizedCity[] {
  if (!normalizedCache) {
    normalizedCache = getCities().map((city) => ({
      city,
      normalizedName: normalize(city.name),
      normalizedAliases: city.aliases.map(normalize),
    }));
  }
  return normalizedCache;
}

/**
 * Substring match against display name and aliases (case/diacritic-insensitive), per FR-003.
 * A match via an alias still resolves to — and should be displayed as — the city's display name.
 */
export function searchCities(query: string, limit = 8): City[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return getNormalizedCities()
    .filter(
      ({ normalizedName, normalizedAliases }) =>
        normalizedName.includes(q) ||
        normalizedAliases.some((a) => a.includes(q)),
    )
    .slice(0, limit)
    .map(({ city }) => city);
}

export interface CityReveal {
  name: string;
  province: string;
  population: number;
  populationSource: string;
  populationDate: string;
  imageSource: string;
  wikipedia: string;
}

/** The full answer payload for a win/loss reveal — safe only once the puzzle is over (FR-010). */
export function toRevealPayload(city: City): CityReveal {
  return {
    name: city.name,
    province: city.province,
    population: city.population,
    populationSource: city.populationSource,
    populationDate: city.populationDate,
    imageSource: city.image.source,
    wikipedia: city.wikipedia,
  };
}

/** Resolves free text (display name or alias) to a known city, or undefined if none match. */
export function resolveCity(query: string): City | undefined {
  const q = normalize(query.trim());
  return getNormalizedCities().find(
    ({ normalizedName, normalizedAliases }) =>
      normalizedName === q || normalizedAliases.some((a) => a === q),
  )?.city;
}
