# Email Banner Generation Feature - Implementation Guide

## Overview

The PitchScout application now includes a professional **HTML email banner generator** that creates personalized pitch emails based on website analysis. This feature transforms the analysis results into a visually appealing email template that users can copy, preview, or download.

## Feature Structure

### 1. Core Components

#### `src/lib/email-banner.server.ts`
- **Purpose**: Generates HTML and plain text email banners
- **Main Function**: `generateEmailBanner(input: EmailBannerInput): EmailBannerOutput`
- **Features**:
  - Professional HTML email with responsive design
  - Customizable colors and branding
  - Benefits grid layout
  - Problem/Solution highlights
  - Sender information section
  - CTA (Call to Action) components
  - Mobile-responsive design

#### `src/lib/pitch-email.server.ts`
- **Purpose**: Integrates email banner generation with analysis results
- **Main Function**: `generatePitchEmailFromAnalysis(request: PitchEmailRequest)`
- **Features**:
  - Extracts pitch details from analysis
  - Maps opportunities to benefits
  - Generates email subject lines
  - Combines analysis data with banner generation

#### `src/lib/pitch-email.functions.ts`
- **Purpose**: Server functions for client-side calls
- **Functions**:
  - `generatePitchEmailBanner()` - Generates and saves banner to research
  - `previewPitchEmailBanner()` - Generates preview without saving

#### `src/components/email-banner-preview.tsx`
- **Purpose**: React component for email banner preview and download
- **Features**:
  - Preview button with iframe display
  - Copy HTML to clipboard
  - Download as HTML file
  - Download as plain text file
  - Usage instructions

### 2. Integration Points

#### In `src/components/analysis-results.tsx`
- Added after the "Outreach for your preferred pitch" section
- Displays when user has chosen a preferred pitch
- Only visible to authenticated users (not guests)
- Provides seamless workflow from pitch selection to email generation

## How It Works

### User Flow

1. **Website Analysis**
   - User inputs website URL
   - System analyzes business details
   
2. **Choose Pitch**
   - User selects preferred opportunity/pitch
   
3. **Generate Email Banner**
   - System extracts key details:
     - Business name and industry
     - Main opportunity title
     - Problem statement
     - Solution description
     - Key benefits from opportunities
   
4. **Preview & Download**
   - User can preview the banner in an iframe
   - Copy HTML code for email clients
   - Download as standalone HTML file
   - Download plain text version

### Data Extracted from Analysis

The email banner extracts the following from `AnalysisResult`:
- **Business Name**: `analysis.business.name`
- **Industry**: `analysis.business.industry`
- **Opportunity Title**: `analysis.bestPitch.title`
- **Problem**: `analysis.bestPitch.why`
- **Solution**: `analysis.bestPitch.whatToOffer`
- **Benefits**: Up to 4 items from:
  - `analysis.opportunities[].title`
  - `analysis.opportunities[].solution`

### Banner Components

The generated HTML banner includes:

1. **Header Section**
   - Personalized greeting
   - Business observation
   
2. **Main Banner**
   - Gradient background (customizable colors)
   - Large headline with accent color
   - Solution description
   - 4-column features grid with icons
   
3. **Content Sections**
   - Problem highlight (yellow box)
   - Solution highlight (green box)
   
4. **CTA Section**
   - Call-to-action text
   - Customizable action buttons
   
5. **Sender Section**
   - Sender name and role
   - Email and website links
   
6. **Footer**
   - Personalization note

## Email Banner Inputs

```typescript
type EmailBannerInput = {
  businessName: string;
  industry?: string;
  opportunity: string;
  opportunityTitle?: string;
  problem: string;
  solution: string;
  benefits: string[];
  senderName?: string;
  senderRole?: string;
  senderWebsite?: string;
  contactEmail?: string;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
  };
};
```

## Email Banner Output

```typescript
type EmailBannerOutput = {
  html: string;        // Full HTML email template
  plainText: string;   // Plain text fallback version
};
```

## Customization Options

### Color Theming
The banner supports custom brand colors:
- **Primary Color**: Main button and accent color (default: `#0D47A1`)
- **Accent Color**: Highlight and feature box colors (default: `#28A745`)
- **Background Color**: Email container background (default: `#FFFFFF`)

### Sender Information
Customize in `EmailBannerPreview` component props:
- `senderName`: Full name or title
- `senderEmail`: Contact email address
- `senderRole`: Professional role/title
- `senderWebsite`: Portfolio or company website

## Usage Examples

### In React Component
```typescript
import { EmailBannerPreview } from '@/components/email-banner-preview';
import type { AnalysisResult } from '@/lib/analyze.server';

export function MyComponent({ result }: { result: AnalysisResult }) {
  return (
    <EmailBannerPreview 
      result={result}
      senderName="Your Name"
      senderEmail="your@email.com"
      senderRole="Growth Consultant"
    />
  );
}
```

### Direct Function Call
```typescript
import { generateEmailBanner } from '@/lib/email-banner.server';

const banner = generateEmailBanner({
  businessName: "Austin's Greatest Plumbing",
  industry: "Plumbing Services",
  opportunity: "Emergency Request Capture",
  opportunityTitle: "Never Miss Another Emergency Call",
  problem: "After-hours emergency requests may be getting missed when calls go to voicemail",
  solution: "AI-powered 24/7 lead capture system that qualifies requests, collects details, and alerts your team by SMS",
  benefits: [
    "24/7 Lead Capture",
    "Instant SMS Alerts",
    "Job Intake & Scheduling",
    "More Jobs, More Revenue"
  ],
  senderName: "Gift Olaniran",
  senderEmail: "gift@example.com",
  senderRole: "AI Automation Specialist",
  senderWebsite: "portfolio.vercel.app"
});

console.log(banner.html);      // Copy to email
console.log(banner.plainText); // Alternative text version
```

## File References

All new files follow the existing codebase structure:
- **Server files** (`.server.ts`): Can only run on the server
- **Function files** (`.functions.ts`): Server functions callable from client
- **Component files** (`.tsx`): React components for UI

## Testing the Feature

1. **Navigate to Analysis Results**
   - Paste a business website URL
   - Click "Analyze Business"
   - Wait for analysis to complete

2. **Choose a Pitch**
   - Select one of the recommended opportunities
   - Click "Choose pitch" or "Preferred pitch"

3. **Generate Email Banner**
   - Scroll to "Professional Email Banner" section
   - Click "Preview Banner" to see the design
   - Click "Copy HTML" to copy for email client
   - Click "Download HTML" or "Download Text" to save locally

4. **Use in Email**
   - Open your email client (Gmail, Outlook, etc.)
   - Create new email
   - Paste HTML as email content OR upload downloaded file
   - Customize sender details if needed
   - Send to prospect

## Benefits

✅ **Time-Saving**: Automatically generates professional emails  
✅ **Consistent Branding**: Matches website analysis findings  
✅ **Mobile-Ready**: Responsive design for all devices  
✅ **Customizable**: Adjust colors and sender information  
✅ **Multi-Format**: HTML, plain text, and downloadable options  
✅ **Personalized**: Based on actual business analysis  
✅ **Professional**: Clean, modern email design  

## Next Steps / Future Enhancements

- [ ] Save generated banners to research record
- [ ] Email banner templates library
- [ ] A/B testing for different banner designs
- [ ] Direct email sending integration (Gmail API)
- [ ] Banner analytics (open rates, clicks)
- [ ] Template branching (different designs for different industries)
- [ ] AI-powered subject line optimization
- [ ] Multi-language support
