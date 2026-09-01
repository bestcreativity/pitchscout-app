import { useState } from "react";
import { Copy, Download, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import type { AnalysisResult } from "@/lib/analyze.server";
import { generatePitchEmailFromAnalysis } from "@/lib/pitch-email.server";

interface EmailBannerPreviewProps {
  result: AnalysisResult;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  senderWebsite?: string;
}

export function EmailBannerPreview({
  result,
  senderName = "Growth Consultant",
  senderEmail = "your-email@example.com",
  senderRole = "Business Development Specialist",
  senderWebsite = "portfolio.vercel.app",
}: EmailBannerPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [copying, setCopying] = useState(false);

  // Generate the pitch email
  const pitchEmail = generatePitchEmailFromAnalysis({
    analysisResult: result,
    senderName,
    senderRole,
    senderEmail,
    senderWebsite,
  });

  async function copyToClipboard() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(pitchEmail.html);
      alert("HTML banner copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    } finally {
      setCopying(false);
    }
  }

  function downloadAsHtml() {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/html;charset=utf-8," + encodeURIComponent(pitchEmail.html)
    );
    element.setAttribute(
      "download",
      `pitch-email-${result.business.name.toLowerCase().replace(/\s+/g, "-")}.html`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function downloadAsPlainText() {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(pitchEmail.plainText)
    );
    element.setAttribute(
      "download",
      `pitch-email-${result.business.name.toLowerCase().replace(/\s+/g, "-")}.txt`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Generated Email Subject:
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <p className="font-medium text-foreground">{pitchEmail.subject}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="size-4" />
          {showPreview ? "Hide Preview" : "Preview Banner"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={copyToClipboard}
          disabled={copying}
        >
          <Copy className="size-4" />
          {copying ? "Copying..." : "Copy HTML"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={downloadAsHtml}
        >
          <Download className="size-4" />
          Download HTML
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={downloadAsPlainText}
        >
          <Download className="size-4" />
          Download Text
        </Button>
      </div>

      {showPreview && (
        <div className="mt-6 rounded-lg border border-border overflow-hidden bg-white">
          <div className="max-h-96 overflow-y-auto">
            <iframe
              srcDoc={pitchEmail.html}
              className="w-full border-none"
              title="Email Banner Preview"
              style={{ height: "600px" }}
            />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-accent/10 p-4 text-sm">
        <p className="font-medium text-foreground mb-2">📧 How to use this banner:</p>
        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
          <li>Copy the HTML and paste into your email client</li>
          <li>Download as HTML file to send as attachment</li>
          <li>Use the plain text version for email if needed</li>
          <li>Customize the sender details before sending</li>
        </ul>
      </div>
    </div>
  );
}
