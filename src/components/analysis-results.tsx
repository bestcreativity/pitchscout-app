import {
  ChevronRight,
  ExternalLink,
  Info,
  Link2,
  ListOrdered,
  Mail,
  MapPin,
  Phone,
  Target,
} from "lucide-react";
import { useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AnalysisResult, Opportunity } from "@/lib/analyze.server";
import {
  createOutreachDraft,
  outreachUrl,
  PLATFORM_LABELS,
  type OutreachPlatform,
} from "@/lib/outreach";

export function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  return (
    <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
      Score {score}
    </span>
  );
}

export function ConfidencePill({ confidence }: { confidence: string }) {
  const tone =
    confidence === "High"
      ? "bg-success/12 text-success"
      : confidence === "Medium"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${tone}`}>
      {confidence} confidence
    </span>
  );
}

function CardHead({
  title,
  icon,
  copyText,
}: {
  title: string;
  icon?: React.ReactNode;
  copyText: () => string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      <CopyButton text={copyText} />
    </div>
  );
}

/* ---------- copy text builders ---------- */

function overviewText(r: AnalysisResult) {
  const b = r.business;
  return [
    `BUSINESS OVERVIEW — ${b.name}`,
    r.url,
    "",
    `Industry: ${b.industry}`,
    `Location: ${b.location}`,
    `What they do: ${b.whatTheyDo}`,
    `Who they serve: ${b.whoTheyServe}`,
    `Main products / services: ${b.services}`,
    `Business model: ${b.businessModel}`,
  ].join("\n");
}

function bestPitchText(r: AnalysisResult) {
  const p = r.bestPitch;
  return [
    `WHAT TO PITCH: ${p.title} (${p.score}%)`,
    "",
    `Why: ${p.why}`,
    `What to offer: ${p.whatToOffer}`,
    `How to approach them: ${p.howToApproach}`,
  ].join("\n");
}

function contactText(r: AnalysisResult) {
  const c = r.contact;
  return [
    "CONTACT & SOCIAL PROFILES",
    `Email: ${c.emails.length ? c.emails.join(", ") : "Not available"}`,
    `Phone: ${c.phones.length ? c.phones.join(", ") : "Not available"}`,
    `Address: ${c.address}`,
    `Contact page: ${c.contactPageUrl}`,
    `Social: ${
      c.socials.length
        ? c.socials.map((s) => `${s.platform} — ${s.url}`).join("\n        ")
        : "Not available"
    }`,
  ].join("\n");
}

function pitchStructureText(r: AnalysisResult) {
  const p = r.pitchStructure;
  return [
    "HOW TO STRUCTURE THE PITCH MESSAGE",
    "",
    `Subject line: ${p.subjectLine}`,
    `Opening: ${p.opening}`,
    "",
    "Key points to cover:",
    ...p.points.map((pt, i) => `${i + 1}. ${pt.point} — ${pt.detail}`),
    "",
    `Call to action: ${p.callToAction}`,
    `Tone tips: ${p.toneTips}`,
  ].join("\n");
}

function opportunityText(o: Opportunity) {
  return [
    `OPPORTUNITY: ${o.title}`,
    `Score: ${o.score} | Confidence: ${o.confidence} | Value: ${money(o.valueLow)}–${money(o.valueHigh)}`,
    "",
    `Problem: ${o.problem}`,
    `Evidence: ${o.evidence}`,
    `Opportunity: ${o.opportunity}`,
    `Solution: ${o.solution}`,
    `Business benefit: ${o.benefit}`,
    `Pitch angle: ${o.pitchAngle}`,
  ].join("\n");
}

function opportunitiesText(r: AnalysisResult) {
  return r.opportunities.map(opportunityText).join("\n\n———\n\n");
}

function findingsText(r: AnalysisResult) {
  return [
    "WEBSITE FINDINGS",
    "",
    ...r.websiteFindings.map(
      (f) => `• ${f.finding}\n  Evidence: ${f.evidence}\n  Impact: ${f.impact}`,
    ),
  ].join("\n");
}

export function fullReportText(r: AnalysisResult) {
  return [
    overviewText(r),
    bestPitchText(r),
    contactText(r),
    pitchStructureText(r),
    "TOP OPPORTUNITIES",
    opportunitiesText(r),
    findingsText(r),
  ].join("\n\n==============================\n\n");
}

/* ---------- results ---------- */

type AnalysisResultsProps = {
  result: AnalysisResult;
  selectedPitchTitle?: string;
  onPitchChosen?: (opportunity: Opportunity) => void;
  isGuest?: boolean;
};

export function AnalysisResults({
  result,
  selectedPitchTitle,
  onPitchChosen,
  isGuest = false,
}: AnalysisResultsProps) {
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [chosenTitle, setChosenTitle] = useState(
    selectedPitchTitle ?? result.opportunities[0]?.title,
  );
  const [platform, setPlatform] = useState<OutreachPlatform>("gmail");
  const chosen =
    result.opportunities.find((o) => o.title === chosenTitle) ??
    result.opportunities[0];
  const b = result.business;
  const best = result.bestPitch;

  return (
    <div className="space-y-8">
      {result.partial && (
        <div className="animate-rise flex gap-3 rounded-2xl border border-border bg-secondary p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Some information could not be verified. The recommendations below
              are based only on the available information.
            </p>
            {result.notes.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <CopyButton
          text={() => fullReportText(result)}
          label="Copy full report"
        />
      </div>

      {/* 1. Business */}
      <section className="animate-rise rounded-3xl border border-border bg-card p-7">
        <CardHead title="Business Overview" copyText={() => overviewText(result)} />
        <p className="mt-2 text-2xl font-semibold text-foreground">{b.name}</p>
        <p className="text-sm text-muted-foreground">{result.url}</p>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Detail label="Industry" value={b.industry} />
          <Detail label="Location" value={b.location} />
          <Detail label="What they do" value={b.whatTheyDo} />
          <Detail label="Who they serve" value={b.whoTheyServe} />
          <Detail label="Main products / services" value={b.services} />
          <Detail label="Business model" value={b.businessModel} />
        </dl>
      </section>

      {/* 2. Best thing to pitch */}
      <section className="animate-rise rounded-3xl border border-primary/25 bg-accent/45 p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent-foreground">
            <Target className="size-4" /> What should I pitch?
          </h2>
          <CopyButton text={() => bestPitchText(result)} />
        </div>
        <p className="mt-3 flex flex-wrap items-baseline gap-3 text-2xl font-semibold text-foreground">
          {best.title}
          <span className="text-base font-semibold text-primary">
            {best.score}%
          </span>
        </p>
        <div className="mt-5 space-y-5">
          <Field label="Why" value={best.why} />
          <Field label="What to offer" value={best.whatToOffer} />
          <Field label="How to approach them" value={best.howToApproach} />
        </div>
      </section>

      {/* 2b. Contact information */}
      <section className="animate-rise rounded-3xl border border-border bg-card p-7">
        <CardHead
          title="Contact & Social Profiles Found"
          copyText={() => contactText(result)}
        />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Mail className="size-3.5" /> Email
            </p>
            {result.contact.emails.length ? (
              <ul className="mt-1.5 space-y-1">
                {result.contact.emails.map((e) => (
                  <li key={e} className="flex items-center gap-2">
                    <a
                      href={`mailto:${e}`}
                      className="break-all text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
                    >
                      {e}
                    </a>
                    <CopyButton text={e} label="" className="px-2" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-muted-foreground">Not available</p>
            )}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Phone className="size-3.5" /> Phone
            </p>
            {result.contact.phones.length ? (
              <ul className="mt-1.5 space-y-1">
                {result.contact.phones.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <a
                      href={`tel:${p.replace(/[^+\d]/g, "")}`}
                      className="text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
                    >
                      {p}
                    </a>
                    <CopyButton text={p} label="" className="px-2" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-muted-foreground">Not available</p>
            )}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="size-3.5" /> Address
            </p>
            <p className="mt-1.5 leading-relaxed text-foreground">
              {result.contact.address}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="size-3.5" /> Contact page
            </p>
            {/^https?:\/\//.test(result.contact.contactPageUrl) ? (
              <a
                href={result.contact.contactPageUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1.5 block break-all text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
              >
                {result.contact.contactPageUrl}
              </a>
            ) : (
              <p className="mt-1.5 text-muted-foreground">
                {result.contact.contactPageUrl}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Social media found
        </p>
        {result.contact.socials.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.contact.socials.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:bg-accent"
                >
                  {s.platform} <ExternalLink className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">
            No social profiles found on the site.
          </p>
        )}
      </section>

      {/* 2c. How to structure the pitch message */}
      {!isGuest && (
        <section className="animate-rise rounded-3xl border border-border bg-card p-7">
          <CardHead
            title="How to structure the pitch message"
            icon={<ListOrdered className="size-4" />}
            copyText={() => pitchStructureText(result)}
          />
          <div className="mt-5 space-y-5">
            <Field label="Subject line" value={result.pitchStructure.subjectLine} />
            <Field label="Opening" value={result.pitchStructure.opening} />
            {result.pitchStructure.points.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key points to cover
                </p>
                <ol className="mt-3 space-y-3">
                  {result.pitchStructure.points.map((p, i) => (
                    <li key={p.point} className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-medium text-foreground">
                          {p.point}
                        </span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                          {p.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Field label="Call to action" value={result.pitchStructure.callToAction} />
            <Field label="Tone tips" value={result.pitchStructure.toneTips} />
          </div>
        </section>
      )}

      {isGuest && (
        <div className="animate-rise rounded-3xl border border-primary/25 bg-accent/10 p-7">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Sign up to unlock:</span>
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Full pitch message templates and structures</li>
            <li>• Email, LinkedIn, and other outreach templates</li>
            <li>• Follow-up message crafting</li>
            <li>• Save and organize all your research</li>
          </ul>
        </div>
      )}

      {/* 3. Opportunities */}
      <section className="animate-rise">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top {result.opportunities.length} Opportunities
          </h2>
          <CopyButton text={() => opportunitiesText(result)} label="Copy all" />
        </div>
        <ul className="mt-4 space-y-3">
          {result.opportunities.map((o) => (
            <li
              key={o.title}
              className="rounded-3xl border border-border bg-card transition-all hover:border-primary/40"
            >
              <button
                onClick={() => setSelected(o)}
                className="group w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      {o.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {o.problem}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ScorePill score={o.score} />
                  <ConfidencePill confidence={o.confidence} />
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                    {money(o.valueLow)}–{money(o.valueHigh)}
                  </span>
                </div>
              </button>
              <div className="flex items-center justify-between gap-3 px-5 pb-4">
                <Button
                  type="button"
                  size="sm"
                  variant={chosen?.title === o.title ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => {
                    setChosenTitle(o.title);
                    onPitchChosen?.(o);
                  }}
                >
                  {chosen?.title === o.title ? "Preferred pitch" : "Choose pitch"}
                </Button>
                <CopyButton text={() => opportunityText(o)} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 px-1 text-xs text-muted-foreground">
          Project values are rough indicative ranges, not guaranteed prices or
          revenue.
        </p>
      </section>

      {chosen && !isGuest && (
        <section className="animate-rise rounded-3xl border border-primary/25 bg-card p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Outreach for your preferred pitch
              </h2>
              <p className="mt-2 text-xl font-semibold text-foreground">{chosen.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PLATFORM_LABELS) as OutreachPlatform[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={platform === item ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setPlatform(item)}
                >
                  {PLATFORM_LABELS[item]}
                </Button>
              ))}
            </div>
          </div>
          <OutreachActions
            platform={platform}
            draft={createOutreachDraft(b.name, chosen)}
          />
        </section>
      )}

      {/* 4. Website findings */}
      {result.websiteFindings.length > 0 && (
        <section className="animate-rise rounded-3xl border border-border bg-card p-7">
          <CardHead
            title="Website Findings"
            copyText={() => findingsText(result)}
          />
          <ul className="mt-5 space-y-5">
            {result.websiteFindings.map((f) => (
              <li
                key={f.finding}
                className="border-b border-border pb-5 last:border-0 last:pb-0"
              >
                <p className="font-medium text-foreground">{f.finding}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Evidence: </span>
                  {f.evidence}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Impact: </span>
                  {f.impact}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6 text-xl leading-snug">
                  {selected.title}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-10">
                <div className="flex flex-wrap items-center gap-3">
                  <ScorePill score={selected.score} />
                  <ConfidencePill confidence={selected.confidence} />
                  <CopyButton
                    text={() => opportunityText(selected)}
                    label="Copy details"
                  />
                </div>
                <Field label="Problem" value={selected.problem} />
                <Field label="Evidence" value={selected.evidence} />
                <Field label="Opportunity" value={selected.opportunity} />
                <Field label="Solution" value={selected.solution} />
                <Field label="Business Benefit" value={selected.benefit} />
                <Field label="Pitch Angle" value={selected.pitchAngle} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Potential project value
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {money(selected.valueLow)}–{money(selected.valueHigh)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Indicative range only — not a quote or guaranteed revenue.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OutreachActions({
  platform,
  draft,
}: {
  platform: OutreachPlatform;
  draft: { subject: string; message: string };
}) {
  return (
    <div className="mt-6 space-y-4">
      {platform === "gmail" && (
        <p className="text-sm text-muted-foreground">
          Subject: <span className="text-foreground">{draft.subject}</span>
        </p>
      )}
      <p className="whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground">
        {draft.message}
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={`${platform === "gmail" ? `Subject: ${draft.subject}\n\n` : ""}${draft.message}`}
          label="Copy message"
        />
        <Button asChild size="sm" className="rounded-full">
          <a href={outreachUrl(platform, draft)} target="_blank" rel="noreferrer noopener">
            Open {PLATFORM_LABELS[platform]}
          </a>
        </Button>
      </div>
      {platform !== "gmail" && (
        <p className="text-xs text-muted-foreground">
          The message is copied separately because this platform does not support reliable prefilled messages.
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 leading-relaxed text-foreground">{value}</dd>
    </div>
  );
}
