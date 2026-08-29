export type LeadSource = "website" | "personal_profile";

export type Lead = {
  id: string;
  name: string;
  company: string;
  role: string;
  service: string;
  location: string;
  source: LeadSource;
  email?: string;
  phone?: string;
  website?: string;
  addedAt: string;
};

const SEEN_LEADS_KEY = "ace_pitch_seen_leads_v1";
const LEADS_STORE_KEY = "ace_pitch_leads_store_v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function buildLeadKey(lead: Pick<Lead, "company" | "name" | "email" | "phone" | "website" | "location">) {
  const parts = [
    lead.company ?? "",
    lead.name ?? "",
    lead.email ?? "",
    lead.phone ?? "",
    lead.website ?? "",
    lead.location ?? "",
  ].join("|").toLowerCase();
  return parts.replace(/\s+/g, "").trim();
}

export function getSeenLeadKeys(): string[] {
  return readJson<string[]>(SEEN_LEADS_KEY, []);
}

export function rememberSeenLeadKeys(leads: Lead[]) {
  const existing = new Set(getSeenLeadKeys());
  for (const lead of leads) {
    existing.add(buildLeadKey(lead));
  }
  writeJson(SEEN_LEADS_KEY, Array.from(existing));
}

export function getStoredLeads(): Lead[] {
  return readJson<Lead[]>(LEADS_STORE_KEY, []);
}

export function addStoredLead(lead: Lead) {
  const current = getStoredLeads();
  const next = [lead, ...current.filter((item) => buildLeadKey(item) !== buildLeadKey(lead))];
  writeJson(LEADS_STORE_KEY, next);
  rememberSeenLeadKeys([lead]);
}

export function removeStoredLead(id: string) {
  const current = getStoredLeads();
  const next = current.filter((lead) => lead.id !== id);
  writeJson(LEADS_STORE_KEY, next);
}

export function generateLeadCandidates({
  service,
  location,
  source,
  total,
}: {
  service: string;
  location: string;
  source: LeadSource;
  total: number;
}): Lead[] {
  const serviceName = service.trim() || "marketing";
  const locationName = location.trim() || "Remote";
  const names = [
    "Maya Thompson",
    "Liam Brooks",
    "Noah Patel",
    "Sofia Nguyen",
    "Ethan Carter",
    "Amelia Rivera",
    "Daniel Kim",
    "Olivia James",
    "James Foster",
    "Hannah Reed",
    "Grace Lewis",
    "Leo Martin",
  ];
  const companies = [
    "Northstar Labs",
    "Summit Growth",
    "Beacon Optimize",
    "Crestline Studio",
    "Harbor Forge",
    "Horizon Commerce",
    "Maple Peak",
    "Redwood Media",
    "Bluebird Foundry",
    "Prism Advisory",
    "Signal Works",
    "Brookside Group",
  ];
  const roles = [
    "Founder",
    "Marketing Lead",
    "Operations Manager",
    "Business Owner",
    "Growth Director",
    "Agency Principal",
  ];

  const candidates: Lead[] = [];
  for (let index = 0; index < total; index += 1) {
    const name = names[index % names.length];
    const company = companies[(index + 1) % companies.length];
    const role = roles[index % roles.length];
    const website = `https://${company.toLowerCase().replace(/\s+/g, "-")}.com`;
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@${company.toLowerCase().replace(/\s+/g, "-")}.com`;
    const phone = `+1 ${(305 + index * 13).toString().slice(0, 3)}-${(240 + index * 27).toString().slice(0, 3)}-${(8000 + index * 97).toString().slice(0, 4)}`;
    const safeService = serviceName.replace(/\s+/g, " ").trim();

    candidates.push({
      id: `${serviceName}-${locationName}-${source}-${index}-${Date.now()}`,
      name,
      company: `${company} ${safeService}`,
      role,
      service: safeService,
      location: locationName,
      source,
      email,
      phone,
      website,
      addedAt: new Date().toISOString(),
    });
  }

  return candidates;
}
