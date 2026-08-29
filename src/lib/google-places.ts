import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Lead, LeadSource } from "@/lib/leads-storage";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.VITE_GOOGLE_PLACES_API_KEY;

type PlacesSearchResult = {
  results?: Array<{
    place_id?: string;
    name?: string;
    formatted_address?: string;
    types?: string[];
    rating?: number;
    user_ratings_total?: number;
    business_status?: string;
    icon?: string;
    website?: string;
    url?: string;
  }>;
  error_message?: string;
};

type PlacesDetailResult = {
  result?: {
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
    opening_hours?: { weekday_text?: string[] };
    url?: string;
    business_status?: string;
    editorial_summary?: { overview?: string };
    place_id?: string;
  };
  error_message?: string;
};

async function googlePlacesFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export const searchPlacesLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        service: z.string().min(1),
        location: z.string().min(1),
        source: z.enum(["website", "personal_profile"]),
        total: z.number().int().min(1).max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("Google Places is not configured. Add GOOGLE_PLACES_API_KEY to the server environment.");
    }

    const { data: budget, error: budgetError } = await context.supabase.rpc("consume_lead_search_budget", {
      requested_count: data.total,
    });
    if (budgetError) throw new Error(`Lead budget is not configured: ${budgetError.message}`);
    const budgetResult = Array.isArray(budget) ? budget[0] : budget;
    if (!budgetResult?.allowed) {
      throw new Error(`Daily lead budget reached. ${budgetResult?.remaining ?? 0} lead slots remain today.`);
    }

    const query = `${data.service} in ${data.location}`.trim();
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("region", "us");

    const searchResult = await googlePlacesFetch<PlacesSearchResult>(searchUrl.toString());

    if (searchResult.error_message) {
      throw new Error(searchResult.error_message);
    }

    const places = (searchResult.results ?? []).slice(0, Math.max(5, data.total * 3));
    const details: Lead[] = [];

    for (const place of places) {
      if (!place.place_id) continue;

      const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      detailsUrl.searchParams.set("place_id", place.place_id);
      detailsUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      detailsUrl.searchParams.set("fields", "name,place_id,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,opening_hours,url,business_status,editorial_summary");
      detailsUrl.searchParams.set("language", "en");

      const detailResult = await googlePlacesFetch<PlacesDetailResult>(detailsUrl.toString());

      if (detailResult.error_message) continue;
      const result = detailResult.result;
      if (!result?.name) continue;

      const website = result.website;
      const phone = result.formatted_phone_number;
      const company = result.name;
      const locationText = result.formatted_address || data.location;
      const peopleName = company.includes(" ") ? company.split(" ")[0] : company;
      const matchScore = Math.min(99, Math.max(68, Math.round((result.rating ?? 3.5) * 20 + (result.user_ratings_total ?? 0) / 80 + (website ? 12 : 0))));

      details.push({
        id: `${company}-${result.place_id ?? crypto.randomUUID()}`,
        name: peopleName,
        company,
        role: "Business owner",
        service: data.service,
        location: locationText,
        source: data.source,
        email: undefined,
        phone,
        website,
        addedAt: new Date().toISOString(),
        enrichment: {
          rating: result.rating,
          reviewCount: result.user_ratings_total,
          categories: result.types ?? [],
          overview: result.editorial_summary?.overview ?? undefined,
          businessStatus: result.business_status ?? undefined,
          placeUrl: result.url ?? undefined,
          matchScore,
        },
      });

      if (details.length >= data.total) break;
    }

    if (details.length === 0) {
      return [];
    }

    return details;
  });
