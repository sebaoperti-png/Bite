// Countries, city suggestions and postal-code formats for the profile form.
import { t, tMaybe } from "../shared/i18n";

export interface Country {
  name: string;
  postal: RegExp; // what a valid postal code looks like
  example: string; // placeholder
  cities: string[]; // suggestions (any city can be typed)
}

export const COUNTRIES: Country[] = [
  { name: "Germany", postal: /^\d{5}$/, example: "60311", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Leipzig", "Stuttgart", "Düsseldorf", "Dresden", "Fulda"] },
  { name: "Austria", postal: /^\d{4}$/, example: "1010", cities: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"] },
  { name: "Switzerland", postal: /^\d{4}$/, example: "8001", cities: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"] },
  { name: "Italy", postal: /^\d{5}$/, example: "20121", cities: ["Milan", "Rome", "Turin", "Bologna", "Florence", "Naples"] },
  { name: "France", postal: /^\d{5}$/, example: "75001", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux"] },
  { name: "Spain", postal: /^\d{5}$/, example: "28001", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"] },
  { name: "Netherlands", postal: /^\d{4}\s?[A-Za-z]{2}$/, example: "1012 AB", cities: ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"] },
  { name: "Belgium", postal: /^\d{4}$/, example: "1000", cities: ["Brussels", "Antwerp", "Ghent", "Liège"] },
  { name: "Denmark", postal: /^\d{4}$/, example: "1050", cities: ["Copenhagen", "Aarhus", "Odense"] },
  { name: "Poland", postal: /^\d{2}-\d{3}$/, example: "00-001", cities: ["Warsaw", "Kraków", "Wrocław", "Gdańsk"] },
  { name: "Czechia", postal: /^\d{3}\s?\d{2}$/, example: "110 00", cities: ["Prague", "Brno", "Ostrava"] },
  { name: "United Kingdom", postal: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: "SW1A 1AA", cities: ["London", "Manchester", "Edinburgh", "Bristol", "Birmingham"] },
  { name: "Ireland", postal: /^[A-Za-z]\d[\dWw]\s?[A-Za-z\d]{4}$/, example: "D02 X285", cities: ["Dublin", "Cork", "Galway"] },
  { name: "Portugal", postal: /^\d{4}-\d{3}$/, example: "1100-148", cities: ["Lisbon", "Porto", "Braga"] },
  { name: "Sweden", postal: /^\d{3}\s?\d{2}$/, example: "111 22", cities: ["Stockholm", "Gothenburg", "Malmö"] },
  { name: "United States", postal: /^\d{5}(-\d{4})?$/, example: "10001", cities: ["New York", "San Francisco", "Los Angeles", "Chicago", "Boston"] },
];

export const countryByName = (name: string) => COUNTRIES.find((c) => c.name === name) ?? COUNTRIES[0];

/** Empty postal codes are fine (it's optional); otherwise it must match the country's format */
export const postalError = (country: string, postal: string) => {
  const p = postal.trim();
  if (!p) return null;
  const c = countryByName(country);
  return c.postal.test(p) ? null : t("That doesn't look like a postal code in {country} (e.g. {example})", { country: t(c.name), example: c.example });
};

/** What the rest of the app shows as "where this person is" */
export const placeLabel = (city: string, country: string) => [city.trim(), country].filter(Boolean).join(", ");

/** Shows a stored "City, Country" label in the current language ("Munich, Germany" → "München, Deutschland") */
export const localPlace = (label: string) => label.split(", ").map((part) => tMaybe(part)).join(", ");
