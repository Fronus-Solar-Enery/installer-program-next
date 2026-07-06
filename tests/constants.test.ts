import { describe, it, expect } from "vitest";
import {
  PAKISTAN_LOCATION_DATA,
  CITY_TO_PROVINCE,
  CITY_TO_DISTRICT,
  DISTRICT_CODES,
  CITIES,
  PROVINCES,
} from "@/lib/constants";

describe("PAKISTAN_LOCATION_DATA flattening", () => {
  it("has no duplicate city names across districts/provinces", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const { districts } of PAKISTAN_LOCATION_DATA) {
      for (const { cities } of Object.values(districts)) {
        for (const city of cities) {
          if (seen.has(city)) duplicates.push(city);
          seen.add(city);
        }
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("derives CITY_TO_PROVINCE and CITY_TO_DISTRICT for every city with no data loss", () => {
    const totalCities = PAKISTAN_LOCATION_DATA.flatMap(({ districts }) =>
      Object.values(districts).flatMap(({ cities }) => cities)
    ).length;

    expect(CITIES.length).toBe(totalCities);
    expect(Object.keys(CITY_TO_PROVINCE).length).toBe(totalCities);
    expect(Object.keys(CITY_TO_DISTRICT).length).toBe(totalCities);
  });

  it("only uses provinces declared in PROVINCES", () => {
    for (const { province } of PAKISTAN_LOCATION_DATA) {
      expect(PROVINCES).toContain(province);
    }
  });
});

describe("DISTRICT_CODES", () => {
  it("every district has a 3-letter uppercase code", () => {
    for (const [district, code] of Object.entries(DISTRICT_CODES)) {
      expect(code, `${district} has invalid code "${code}"`).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("has no duplicate codes across districts", () => {
    const codes = Object.values(DISTRICT_CODES);
    const duplicates = codes.filter((code, i) => codes.indexOf(code) !== i);
    expect(duplicates).toEqual([]);
  });
});
