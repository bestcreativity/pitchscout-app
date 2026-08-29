import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Search, Store, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addStoredLead,
  buildLeadKey,
  generateLeadCandidates,
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
  const [service, setService] = useState("Website Design");
  const [location, setLocation] = useState("United States");
  const [source, setSource] = useState<LeadSource>("website");
  const [leadCount, setLeadCount] = useState(8);
  const [results, setResults] = useState<Lead[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  function handleGenerate() {
    const seen = new Set(getSeenLeadKeys());
    const candidates = generateLeadCandidates({
      service,
      location,
      source,
      total: Math.max(1, Math.min(leadCount, 30)),
    }).filter((lead) => !seen.has(buildLeadKey(lead)));

    rememberSeenLeadKeys(candidates);
    setResults(candidates);
    setMessage(
      candidates.length
        ? `Found ${candidates.length} new leads for ${service} in ${location}.`
        : "No new leads were found with the current filters. Try a wider search or different source type.",
    );
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
          <ArrowLeft className="size-4" /> Back to profile
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
            <Button onClick={handleGenerate} className="rounded-full">
              <Search className="size-4" /> Generate leads
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
                  <p><span className="font-medium text-foreground">Email:</span> {lead.email}</p>
                  <p><span className="font-medium text-foreground">Phone:</span> {lead.phone}</p>
                  <p><span className="font-medium text-foreground">Website:</span> {lead.website}</p>
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
