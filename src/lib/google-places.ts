import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Lead } from "@/lib/leads-storage";

const BING_MAPS_KEY = process.env.BING_MAPS_KEY;
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;

type Location = { lat: number; lon: number; displayName: string };
type Element = { id: number; type: "node" | "way" | "relation"; center?: { lat: number; lon: number }; tags?: Record<string, string> };

type FoursquareResult = { rating?: number; categories?: Array<{ name: string }>; website?: string; tel?: string };
type YelpResult = { rating?: number; review_count?: number; categories?: Array<{ title: string }>; url?: string; phone?: string };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Lead provider request failed (${response.status})`);
  return (await response.json()) as T;
}

async function findLocation(query: string): Promise<Location> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const results = await fetchJson<Array<{ lat: string; lon: string; display_name: string }>>(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "ACE-PITCH lead discovery" },
  });
  const first = results[0];
  if (!first) throw new Error(`Location not found: ${query}`);
  return { lat: Number(first.lat), lon: Number(first.lon), displayName: first.display_name };
}

async function findBusinesses(location: Location, total: number) {
  const query = `[out:json][timeout:25];nwr["name"](around:25000,${location.lat},${location.lon});out center tags;`;
  const result = await fetchJson<{ elements?: Element[] }>("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ data: query }),
  });
  return (result.elements ?? []).slice(0, total * 3);
}

async function bingLookup(name: string, location: string) {
  if (!BING_MAPS_KEY) return null;
  const url = new URL("https://dev.virtualearth.net/REST/v1/Locations");
  url.searchParams.set("q", `${name}, ${location}`);
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", BING_MAPS_KEY);
  const result = await fetchJson<{ resourceSets?: Array<{ resources?: Array<{ point?: { coordinates?: number[] }; address?: { formattedAddress?: string } }> }> }>(url.toString());
  return result.resourceSets?.[0]?.resources?.[0] ?? null;
}

async function foursquareLookup(name: string, location: string): Promise<FoursquareResult | null> {
  if (!FOURSQUARE_API_KEY) return null;
  const url = new URL("https://api.foursquare.com/v3/places/search");
  url.searchParams.set("query", name);
  url.searchParams.set("near", location);
  url.searchParams.set("limit", "1");
  const result = await fetchJson<{ results?: FoursquareResult[] }>(url.toString(), { headers: { Authorization: FOURSQUARE_API_KEY, Accept: "application/json" } });
  return result.results?.[0] ?? null;
}

async function yelpLookup(name: string, location: string): Promise<YelpResult | null> {
  if (!YELP_API_KEY) return null;
  const url = new URL("https://api.yelp.com/v3/businesses/search");
  url.searchParams.set("term", name);
  url.searchParams.set("location", location);
  url.searchParams.set("limit", "1");
  const result = await fetchJson<{ businesses?: YelpResult[] }>(url.toString(), { headers: { Authorization: `Bearer ${YELP_API_KEY}`, Accept: "application/json" } });
  return result.businesses?.[0] ?? null;
}

export const searchPlacesLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    service: z.string().min(1).max(120),
    location: z.string().min(1).max(160),
    source: z.enum(["website", "personal_profile"]),
    total: z.number().int().min(1).max(30),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: budget, error: budgetError } = await context.supabase.rpc("consume_lead_search_budget", { requested_count: data.total });
    if (budgetError) throw new Error(`Lead budget is not configured: ${budgetError.message}`);
    const budgetResult = Array.isArray(budget) ? budget[0] : budget;
    if (!budgetResult?.allowed) throw new Error(`Daily lead budget reached. ${budgetResult?.remaining ?? 0} lead slots remain today.`);

    const location = await findLocation(data.location);
    const elements = await findBusinesses(location, data.total);
    const leads: Lead[] = [];

    for (const element of elements) {
      const tags = element.tags ?? {};
      const company = tags.name?.trim();
      if (!company) continue;
      const [bing, foursquare, yelp] = await Promise.all([
        bingLookup(company, data.location).catch(() => null),
        foursquareLookup(company, data.location).catch(() => null),
        yelpLookup(company, data.location).catch(() => null),
      ]);
      const website = tags.website || tags["contact:website"] || foursquare?.website;
      const phone = tags.phone || tags["contact:phone"] || foursquare?.tel || yelp?.phone;
      const categories = [tags.shop, tags.amenity, tags.office, tags.craft, ...(foursquare?.categories?.map((item) => item.name) ?? []), ...(yelp?.categories?.map((item) => item.title) ?? [])].filter(Boolean) as string[];
      const rating = yelp?.rating ?? foursquare?.rating;
      const matchScore = Math.min(99, Math.max(60, Math.round((rating ?? 3.5) * 18 + (website ? 16 : 0) + (phone ? 8 : 0) + Math.min(categories.length * 3, 12))));
      const providers = ["OpenStreetMap", BING_MAPS_KEY && "Bing Maps", FOURSQUARE_API_KEY && "Foursquare", YELP_API_KEY && "Yelp"].filter(Boolean) as string[];

      leads.push({
        id: `osm-${element.type}-${element.id}`,
        name: company.split(" ")[0] || company,
        company,
        role: "Business owner",
        service: data.service,
        location: bing?.address?.formattedAddress || [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", ") || location.displayName,
        source: data.source,
        email: tags.email || tags["contact:email"],
        phone,
        website,
        addedAt: new Date().toISOString(),
        enrichment: {
          rating,
          reviewCount: yelp?.review_count,
          categories: Array.from(new Set(categories)).slice(0, 8),
          businessStatus: tags["opening_hours"] ? `Hours: ${tags["opening_hours"]}` : undefined,
          placeUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
          overview: bing?.point?.coordinates ? `Verified location: ${bing.point.coordinates.join(", ")}` : undefined,
          matchScore,
          providers,
        },
      });
      if (leads.length >= data.total) break;
    }
    return leads;
  });
