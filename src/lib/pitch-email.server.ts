/**
 * Complete Pitch Message Generation with Email Banners
 * Combines website analysis with HTML email banner generation
 */

import type { AnalysisResult } from "./analyze.server";
import { generateEmailBanner } from "./email-banner.server";

export type PitchEmailRequest = {
  analysisResult: AnalysisResult;
  senderName?: string;
  senderRole?: string;
  senderEmail?: string;
  senderWebsite?: string;
  customTheme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
  };
};

export type PitchEmailOutput = {
  html: string;
  plainText: string;
  subject: string;
  preview: string;
  benefits: string[];
};

/**
 * Extract key details from analysis result for email banner
 */
function extractPitchDetails(analysis: AnalysisResult) {
  const bestPitch = analysis.bestPitch;
  const opportunities = analysis.opportunities || [];
  const business = analysis.business;

  // Get the top opportunity
  const topOpportunity = opportunities[0] || {
    title: bestPitch.title,
    problem: bestPitch.why,
    benefit: bestPitch.whatToOffer,
  };

  // Extract benefits from opportunities
  const benefits = opportunities
    .slice(0, 3)
    .map((opp) => {
      const title = opp.title || "";
      const impact = opp.solution || "";
      return `${title}${impact ? ": " + impact : ""}`.substring(0, 80);
    })
    .filter(Boolean);

  // If not enough benefits, add generic ones based on the pitch
  if (benefits.length < 4) {
    const genericBenefits = [
      "Capture every lead 24/7",
      "Qualify requests instantly",
      "Alert your team automatically",
      "Increase response time",
      "Win more business",
      "Reduce missed opportunities",
    ];
    benefits.push(
      ...genericBenefits.filter(
        (b) =>
          !benefits.some((existing) =>
            existing.toLowerCase().includes(b.toLowerCase()),
          ),
      ),
    );
  }

  return {
    businessName: business.name,
    industry: business.industry,
    opportunity: topOpportunity.title || bestPitch.title,
    opportunityTitle: (topOpportunity.title || bestPitch.title).split(":")[0],
    problem: topOpportunity.problem || bestPitch.why,
    solution: topOpportunity.benefit || bestPitch.whatToOffer,
    benefits: benefits.slice(0, 4),
    subject: `Quick idea for ${business.name}: ${bestPitch.title}`,
    preview: `I noticed an opportunity for your business to ${bestPitch.title.toLowerCase()}...`,
  };
}

/**
 * Generate a complete pitch email with HTML banner from analysis results
 */
export function generatePitchEmailFromAnalysis(
  request: PitchEmailRequest,
): PitchEmailOutput {
  const analysis = request.analysisResult;
  const pitchDetails = extractPitchDetails(analysis);

  const bannerOutput = generateEmailBanner({
    businessName: pitchDetails.businessName,
    industry: pitchDetails.industry,
    opportunity: pitchDetails.opportunity,
    opportunityTitle: pitchDetails.opportunityTitle,
    problem: pitchDetails.problem,
    solution: pitchDetails.solution,
    benefits: pitchDetails.benefits,
    senderName: request.senderName || "Growth Consultant",
    senderRole: request.senderRole || "Business Development Specialist",
    senderWebsite: request.senderWebsite || "portfolio.vercel.app",
    contactEmail: request.senderEmail || "contact@example.com",
    theme: request.customTheme,
  });

  return {
    html: bannerOutput.html,
    plainText: bannerOutput.plainText,
    subject: pitchDetails.subject,
    preview: pitchDetails.preview,
    benefits: pitchDetails.benefits,
  };
}

/**
 * Generate just the HTML banner for embedding in emails
 */
export function generateBannerOnly(
  request: PitchEmailRequest,
): { html: string; subject: string } {
  const analysis = request.analysisResult;
  const pitchDetails = extractPitchDetails(analysis);

  const bannerOutput = generateEmailBanner({
    businessName: pitchDetails.businessName,
    industry: pitchDetails.industry,
    opportunity: pitchDetails.opportunity,
    opportunityTitle: pitchDetails.opportunityTitle,
    problem: pitchDetails.problem,
    solution: pitchDetails.solution,
    benefits: pitchDetails.benefits,
    senderName: request.senderName || "Growth Consultant",
    senderRole: request.senderRole || "Business Development Specialist",
    senderWebsite: request.senderWebsite || "portfolio.vercel.app",
    contactEmail: request.senderEmail || "contact@example.com",
    theme: request.customTheme,
  });

  return {
    html: bannerOutput.html,
    subject: pitchDetails.subject,
  };
}
