# PitchScout

Build ACE PITCH

Build a simple personal web application called ACE PITCH.

ACE PITCH is a private tool I will use when scouting businesses for potential clients.

Its purpose is:

I paste a business website URL, ACE PITCH analyzes the business and its digital presence, finds valuable problems and opportunities, then tells me exactly what I should pitch to that business.

This is NOT a public SaaS product.

It is a personal tool.

Keep the application extremely simple, fast and easy to use.

CORE IDEA

The workflow should be:

PASTE URL → ANALYZE → DISCOVER OPPORTUNITIES → CHOOSE BEST PITCH → GENERATE OUTREACH

The tool should analyze both:

THE WEBSITE

and

THE BUSINESS

Do not limit the analysis to technical website problems.

The goal is to understand the business and find things I could realistically sell to them.

SIMPLE HOME PAGE

Create one clean page.

At the top:

ACE PITCH

Find what you can pitch to any business.

Then a large input:

Paste business website URL

Example:

https://examplebusiness.com

Button:

Analyze Business

Below the input, show a small explanation:

ACE PITCH analyzes the business, website, customer experience and digital opportunities to find the strongest services you can pitch.

No complicated navigation.

No pricing page.

No subscription page.

No team management.

No unnecessary dashboard.

ANALYSIS PROCESS

After clicking Analyze Business, show a simple progress screen.

Display:

Analyzing business...

✓ Website found

✓ Business identified

✓ Services identified

✓ Website analyzed

✓ Customer experience analyzed

✓ Digital presence analyzed

✓ Opportunities discovered

✓ Best pitch selected

Then show the results.

BUSINESS OVERVIEW

At the top of the results page:

Business Overview

Show:

Business Name

Industry

Location

What they do

Who they serve

Main products/services

Business model

Keep this concise.

If information cannot be verified, say:

Not available

Do not invent information.

Underneath, show the most important findings.

Example:

Problems Found

Only recommend something if it actually makes sense for the business.

Potential project value

$–$

Do not present estimated project values as guaranteed prices or revenue.

The list should be dynamically generated based on the business.

Do NOT always recommend the same services.

OPPORTUNITY DETAILS

When I click an opportunity, open a simple detail panel.

Show:

Problem

What appears to be wrong or missing.

Evidence

What ACE PITCH observed that led to the recommendation.

Opportunity

What can be improved.

Solution

What I could build or provide.

Business Benefit

Why the business should care.

Pitch Angle

How I should introduce the idea.

Confidence

High / Medium / Low

This is important because I don't want ACE PITCH inventing problems.

"WHAT SHOULD I PITCH?" MODE

The results page should have one extremely clear answer:

WHAT SHOULD I PITCH?

Then:

**opportunity **%

Why:
[Explanation]

What to offer:
[Solution]

How to approach them:
[Pitch angle]

BUSINESS RESEARCH

ACE PITCH should analyze publicly available business information where possible.

Look for:

• Website content

• Services

• About page

• Contact information

• Location

• Social links

• Reviews or reputation signals where available

• Business positioning

• Customer type

• Online presence

• Booking/contact methods

• Visible marketing strategy

• Public business signals

The system should never pretend it found information that it did not actually find.

SIMPLE SCORING

Every opportunity should have a score from 0 to 100.

Base the score on:

Business relevance

Potential value

Evidence

Urgency

Ease of selling

Match with my services

The most important factor should be whether it is a realistic thing to pitch.

RESULT PAGE STRUCTURE

Keep the page in this exact general order:

1. Business

Business name

Industry

Location

What they do

2. 🎯 Best Thing To Pitch

The single strongest opportunity.

3. Top 5 Opportunities

The five best things I could sell.

4. Website Findings

Important business problems.

DESIGN

Keep the design extremely clean.

Use:

• White or very light background

• Dark text

• One primary accent color

• Large typography

• Rounded cards

• Simple icons

• Minimal navigation

• Lots of whitespace

• Subtle animations

Do NOT create:

• Complicated sidebars

• Huge analytics dashboards

• Team management

• Subscription UI

• Complex CRM

• Unnecessary charts

The tool should feel like a private professional scouting assistant.

IMPORTANT

Do not build fake functionality.

The AI should not hallucinate business information.

If the website cannot be analyzed properly, clearly tell the user:

"Some information could not be verified. The recommendations below are based only on the available information."

FINAL PRODUCT GOAL

When I open ACE PITCH, I should be able to do this in seconds:

Paste

https://business.com

↓

Analyze Business

↓

ACE PITCH researches the business.

↓

It tells me:

"Here are the 5 best things you can pitch."

Why they need it

What to build

Why they might buy

How valuable the opportunity is

How confident ACE PITCH

Keep the application simple, fast, intelligent and focused on helping me find clients and decide what to sell them.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/94ddcac4-a1f0-4b7d-8958-065153843e10).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Add a Google Gemini API key to `.env` before running an analysis:

```sh
GEMINI_API_KEY="your-gemini-api-key"
```

Create the key in [Google AI Studio](https://aistudio.google.com/app/apikey). Keep it server-side and do not commit it.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
