import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Briefcase, Check, Save, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStoredLeads, removeStoredLead, type Lead } from "@/lib/leads-storage";
import { saveResearch } from "@/lib/research.functions";

export const Route = createFileRoute("/_authenticated/leads-store")({
  head: () => ({
    meta: [
      { title: "Leads Store — ACE PITCH" },
      { name: "description", content: "Saved leads for outreach and one-by-one research." },
    ],
  }),
  component: LeadsStorePage,
});

function LeadsStorePage() {
  const save = useServerFn(saveResearch);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadWebsite, setLeadWebsite] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    setLeads(getStoredLeads());
  }, []);

  function refresh() {
    setLeads(getStoredLeads());
  }

  async function saveManualLead(event: React.FormEvent) {
    event.preventDefault();
    if (savingManual) return;
    setSavingManual(true);
    try {
      await save({
        data: {
          url: leadWebsite.trim(),
          businessName: leadName.trim(),
          verifiedEmail: leadEmail.trim(),
          bestPitchTitle: "Manual lead outreach",
          result: {
            type: "manual_lead",
            firstMessage: firstMessage.trim(),
            notes: ["Lead details and first outreach message were entered manually."],
          },
        },
      });
      setLeadName("");
      setLeadEmail("");
      setLeadWebsite("");
      setFirstMessage("");
      window.alert("Lead saved to Saved Research.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not save this lead.");
    } finally {
      setSavingManual(false);
    }
  }

  async function openResearch(lead: Lead) {
    const payload = {
      url: lead.website ?? lead.enrichment?.placeUrl ?? "https://www.google.com/maps",
      businessName: lead.company,
      bestPitchTitle: `${lead.service} for ${lead.company}`,
      result: {
        type: "lead_research",
        lead,
        notes: [
          `Research this lead for ${lead.service} opportunities in ${lead.location}.`,
          `Focus on buyer pain, positioning, and an outreach angle tailored to ${lead.company}.`,
          "Lead source: Google Places. Contact fields are only populated when supplied by the provider.",
        ],
      },
    };

    try {
      await save({ data: payload });
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      removeStoredLead(lead.id);
      refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not move this lead to research right now.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Your Background
        </Link>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Leads Store</h1>
            <p className="mt-2 text-muted-foreground">Saved leads are here for deeper research and outreach.</p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={refresh}>Refresh</Button>
        </div>

        <form onSubmit={saveManualLead} className="mt-8 rounded-3xl border border-primary/25 bg-accent/30 p-6">
          <div className="flex items-start gap-3">
            <Briefcase className="mt-1 size-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Save a manual lead</h2>
              <p className="mt-1 text-sm text-muted-foreground">Store the lead, website, email, and the first message so future follow-ups have context.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-lead-name">Lead or business name</Label>
              <Input id="manual-lead-name" value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder="Business name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-lead-email">Gmail or lead email</Label>
              <Input id="manual-lead-email" type="email" value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} placeholder="lead@gmail.com" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual-lead-website">Website</Label>
              <Input id="manual-lead-website" type="url" value={leadWebsite} onChange={(event) => setLeadWebsite(event.target.value)} placeholder="https://business.com" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manual-first-message">First message sent</Label>
              <Textarea id="manual-first-message" value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} placeholder="Paste the first email or message you sent..." rows={5} required />
            </div>
          </div>
          <Button type="submit" className="mt-5 rounded-full" disabled={savingManual}>
            {savingManual ? <Save className="size-4 animate-pulse" /> : <Check className="size-4" />}
            Save lead
          </Button>
        </form>

        {leads.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
            No leads in the store yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.role}</p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      removeStoredLead(lead.id);
                      refresh();
                    }}
                    aria-label={`Remove ${lead.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Company:</span> {lead.company}</p>
                  <p><span className="font-medium text-foreground">Service:</span> {lead.service}</p>
                  <p><span className="font-medium text-foreground">Location:</span> {lead.location}</p>
                  <p><span className="font-medium text-foreground">Source:</span> {lead.source}</p>
                  <p><span className="font-medium text-foreground">Email:</span> {lead.email}</p>
                  <p><span className="font-medium text-foreground">Website:</span> {lead.website}</p>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button className="flex-1 rounded-full" onClick={() => openResearch(lead)}>
                    <Search className="size-4" /> Move to research
                  </Button>
                  {lead.website && (
                    <Button asChild variant="outline" className="rounded-full">
                      <a href={lead.website} target="_blank" rel="noreferrer noopener">
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
