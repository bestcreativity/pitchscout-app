import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Search, Store, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchPlacesLeads } from "@/lib/google-places";
import {
  addStoredLead,
  buildLeadKey,
  getSeenLeadKeys,
  rememberSeenLeadKeys,
  type Lead,
  type LeadSource,
} from "@/lib/leads-storage";

export const Route = createFileRoute("/_authenticated/find-leads")({
  head: () => ({
    meta: [
      { title: "Find Leads — ACE PITCH" },
      { name: "description", content: "Find new leads by service, location, and source type and store them for outreach." },
    ],
  }),
  component: FindLeadsPage,
});

function FindLeadsPage() {
  const searchLeads = useServerFn(searchPlacesLeads);
  const [service, setService] = useState("Website Design");
  const [location, setLocation] = useState("United States");
  const [source, setSource] = useState<LeadSource>("website");
  const [leadCount, setLeadCount] = useState(8);
  const [results, setResults] = useState<Lead[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (loading) return;
    setLoading(true);
    try {
      const seen = new Set(getSeenLeadKeys());
      const total = Math.max(1, Math.min(leadCount, 30));
      const candidates = (await searchLeads({
        data: {
          service,
          location,
          source,
          total,
        },
      })) as Lead[];

      const uniqueCandidates = candidates.filter((lead) => !seen.has(buildLeadKey(lead)));
      rememberSeenLeadKeys(uniqueCandidates);
      setResults(uniqueCandidates);
      setMessage(
        uniqueCandidates.length
          ? `Found ${uniqueCandidates.length} leads for ${service} in ${location} using OpenStreetMap and available enrichment providers.`
          : "No leads matched the current filters. Try a broader service name, city, or source target.",
      );
    } catch (error) {
      setResults([]);
      setMessage(
        error instanceof Error ? error.message : "Lead search failed. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  function moveAllToStore() {
    const unique = results.filter((lead, index, arr) => arr.findIndex((item) => buildLeadKey(item) === buildLeadKey(lead)) === index);
    if (!unique.length) return;
    unique.forEach((lead) => addStoredLead(lead));
    setMessage(`${unique.length} leads moved to Leads Store.`);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Your Background
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h1 className="text-3xl font-semibold text-foreground">Find Leads</h1>
          <p className="mt-2 text-muted-foreground">
            Search for leads by service, location, and target source type. The system will not repeat any lead already seen, even after a delete.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service name</Label>
              <Input id="service" value={service} onChange={(e) => setService(e.target.value)} placeholder="SEO, design, ads..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin, London..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Website target</Label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
              >
                <option value="website">Website</option>
                <option value="personal_profile">Personal profile</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-count">Number of leads</Label>
              <Input id="lead-count" type="number" min={1} max={30} value={leadCount} onChange={(e) => setLeadCount(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleGenerate} disabled={loading} className="rounded-full">
              <Search className="size-4" /> {loading ? "Searching providers..." : "Generate leads"}
            </Button>
            {results.length > 0 && (
              <Button variant="outline" onClick={moveAllToStore} className="rounded-full">
                <Store className="size-4" /> Move all to Leads Store
              </Button>
            )}
          </div>

          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </div>

        {results.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((lead) => (
              <div key={lead.id} className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.role}</p>
                  </div>
                  <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setResults((current) => current.filter((item) => item.id !== lead.id))}>
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Company:</span> {lead.company}</p>
                  <p><span className="font-medium text-foreground">Service:</span> {lead.service}</p>
                  <p><span className="font-medium text-foreground">Location:</span> {lead.location}</p>
                  <p><span className="font-medium text-foreground">Source:</span> {lead.source}</p>
                  {lead.email && <p><span className="font-medium text-foreground">Email:</span> {lead.email}</p>}
                  {lead.phone && <p><span className="font-medium text-foreground">Phone:</span> {lead.phone}</p>}
                  {lead.enrichment?.rating && <p><span className="font-medium text-foreground">Rating:</span> {lead.enrichment.rating} ({lead.enrichment.reviewCount ?? 0} reviews)</p>}
                  {lead.enrichment?.categories?.length ? <p><span className="font-medium text-foreground">Categories:</span> {lead.enrichment.categories.slice(0, 3).join(", ")}</p> : null}
                  {lead.enrichment?.overview && <p><span className="font-medium text-foreground">Overview:</span> {lead.enrichment.overview}</p>}
                  {lead.website && <p><span className="font-medium text-foreground">Website:</span> {lead.website}</p>}
                  {lead.enrichment?.placeUrl && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={lead.enrichment.placeUrl} target="_blank" rel="noreferrer noopener">Open Google Maps <ExternalLink className="size-3" /></a>}
                </div>

                <Button
                  className="mt-5 w-full rounded-full"
                  onClick={() => {
                    addStoredLead(lead);
                    setResults((current) => current.filter((item) => item.id !== lead.id));
                    setMessage(`${lead.name} moved to Leads Store.`);
                  }}
                >
                  <Store className="size-4" /> Move to Leads Store
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
