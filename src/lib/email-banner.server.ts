/**
 * Email Banner Generation Module
 * Generates HTML email banners following the pitch structure shown in the image
 */

export type EmailBannerInput = {
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

export type EmailBannerOutput = {
  html: string;
  plainText: string;
};

/**
 * Generate a professional HTML email banner for pitches
 * Following the structure: greeting + observation + opportunity + solution + benefits + CTA
 */
export function generateEmailBanner(input: EmailBannerInput): EmailBannerOutput {
  const {
    businessName,
    industry = "business",
    opportunity,
    opportunityTitle = opportunity,
    problem,
    solution,
    benefits = [],
    senderName = "AI Automation Specialist",
    senderRole = "Growth Consultant",
    senderWebsite = "portfolio.vercel.app",
    contactEmail = "contact@example.com",
    theme = {},
  } = input;

  const colors = {
    primary: theme.primaryColor || "#0D47A1",
    accent: theme.accentColor || "#28A745",
    background: theme.backgroundColor || "#FFFFFF",
    dark: "#1A1A1A",
    light: "#F5F5F5",
    muted: "#666666",
  };

  // Generate plain text version
  const plainText = `Hi ${businessName},

I was reviewing ${businessName} and noticed you do a great job showcasing your services and making it easy for customers to contact you.

One opportunity I noticed is that ${problem.toLowerCase()}

I help ${industry} companies ${solution.toLowerCase()} with an AI-powered system that qualifies the request, collects details, and instantly alerts your team.

This ensures you never miss a high-value opportunity, even when inquiries go unanswered.

Key benefits:
${benefits.map((b) => `• ${b}`).join("\n")}

Let me know if you're open to a brief call or walkthrough.

Best regards,
${senderName}
${senderRole}
${contactEmail}`;

  // Generate HTML version with styling
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Opportunity</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: ${colors.dark};
      background-color: ${colors.light};
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.background};
      padding: 20px;
    }
    
    .greeting {
      font-size: 14px;
      color: ${colors.dark};
      margin-bottom: 16px;
      line-height: 1.5;
    }
    
    .observation {
      font-size: 14px;
      color: ${colors.muted};
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    .banner-section {
      background: linear-gradient(135deg, ${colors.primary} 0%, #1565C0 100%);
      color: white;
      padding: 40px;
      border-radius: 8px;
      margin: 30px 0;
      position: relative;
      overflow: hidden;
    }
    
    .banner-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255, 0.1);
      border-radius: 50%;
      z-index: 0;
    }
    
    .banner-content {
      position: relative;
      z-index: 1;
    }
    
    .banner-label {
      font-size: 12px;
      font-weight: 600;
      background-color: ${colors.accent};
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .banner-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    
    .banner-title-accent {
      color: ${colors.accent};
    }
    
    .banner-description {
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
      opacity: 0.95;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    
    .feature-item {
      background: rgba(255,255,255, 0.15);
      padding: 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }
    
    .feature-icon {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    .problem-section {
      background-color: #FEF3C7;
      border-left: 4px solid #FBBF24;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .solution-section {
      background-color: #DCFCE7;
      border-left: 4px solid ${colors.accent};
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .benefits-section {
      margin: 24px 0;
    }
    
    .benefits-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      color: ${colors.muted};
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    
    .benefit-item {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .benefit-icon {
      color: ${colors.accent};
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: ${colors.primary};
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 5px;
    }
    
    .cta-text {
      font-size: 14px;
      color: ${colors.muted};
      margin-top: 16px;
      line-height: 1.6;
    }
    
    .footer {
      border-top: 1px solid #EEEEEE;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 12px;
      color: ${colors.muted};
    }
    
    .sender-info {
      background-color: ${colors.light};
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
    }
    
    .sender-name {
      font-weight: 600;
      font-size: 14px;
      color: ${colors.dark};
    }
    
    .sender-role {
      font-size: 12px;
      color: ${colors.muted};
      margin-top: 4px;
    }
    
    .sender-contact {
      font-size: 12px;
      color: ${colors.primary};
      margin-top: 8px;
      word-break: break-all;
    }
    
    @media (max-width: 600px) {
      .email-container {
        padding: 16px;
      }
      
      .banner-section {
        padding: 24px 20px;
      }
      
      .banner-title {
        font-size: 24px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Greeting -->
    <div class="greeting">
      Hi ${businessName},
    </div>
    
    <!-- Observation -->
    <div class="observation">
      I was reviewing ${businessName} and noticed you do a great job showcasing your services and making it easy for customers to contact you.
    </div>
    
    <!-- Main Banner Section -->
    <div class="banner-section">
      <div class="banner-content">
        <div class="banner-label">FOR ${businessName.toUpperCase()}</div>
        <div class="banner-title">
          Never Miss Another<br>
          <span class="banner-title-accent">${opportunityTitle}.</span>
        </div>
        <div class="banner-description">
          ${solution.charAt(0).toUpperCase() + solution.slice(1)} — so you can respond faster and win more customers.
        </div>
        
        <!-- Features Grid -->
        ${
          benefits.length > 0
            ? `
        <div class="features-grid">
          ${benefits
            .slice(0, 4)
            .map((benefit, i) => {
              const icons = ["⚡", "📞", "📋", "📈"];
              return `
            <div class="feature-item">
              <div class="feature-icon">${icons[i]}</div>
              <div>${benefit}</div>
            </div>
          `;
            })
            .join("")}
        </div>
        `
            : ""
        }
      </div>
    </div>
    
    <!-- Problem Section -->
    <div class="problem-section">
      <strong>The Challenge:</strong> ${problem}
    </div>
    
    <!-- Solution Section -->
    <div class="solution-section">
      <strong>The Solution:</strong> ${solution}
    </div>
    
    <!-- CTA Section -->
    <div class="cta-section">
      <p class="cta-text">
        If this sounds like something that could help, I'd be happy to show you how this would work for your business.
      </p>
      <p class="cta-text">
        Let me know if you're open to a brief call or walkthrough.
      </p>
    </div>
    
    <!-- Sender Info -->
    <div class="sender-info">
      <div class="sender-name">By ${senderName}</div>
      <div class="sender-role">${senderRole}</div>
      <div class="sender-contact">
        📧 <a href="mailto:${contactEmail}" style="color: ${colors.primary}; text-decoration: none;">${contactEmail}</a><br>
        🌐 <a href="https://${senderWebsite}" style="color: ${colors.primary}; text-decoration: none;">${senderWebsite}</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>
        This message was personalized based on research of your business and website. 
        We respect your time and only reach out when we identify a genuine opportunity.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { html, plainText };
}

/**
 * Generate a complete pitch email combining analysis results with HTML banner
 */
export function generateCompletePitchEmail(
  businessName: string,
  analysisData: {
    industry?: string;
    opportunity: string;
    opportunityTitle?: string;
    problem: string;
    solution: string;
    benefits?: string[];
    openingLine?: string;
  },
  senderInfo?: {
    name?: string;
    role?: string;
    website?: string;
    email?: string;
  },
): EmailBannerOutput {
  return generateEmailBanner({
    businessName,
    industry: analysisData.industry,
    opportunity: analysisData.opportunity,
    opportunityTitle: analysisData.opportunityTitle,
    problem: analysisData.problem,
    solution: analysisData.solution,
    benefits: analysisData.benefits || [],
    senderName: senderInfo?.name,
    senderRole: senderInfo?.role,
    senderWebsite: senderInfo?.website,
    contactEmail: senderInfo?.email,
  });
}
