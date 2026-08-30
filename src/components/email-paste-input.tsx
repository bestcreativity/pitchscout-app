import { useCallback, useRef } from "react";
import { Mail, Clipboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EmailPasteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEmailDetected?: (email: string) => void;
}

// Email regex pattern
const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

export function EmailPasteInput({
  value,
  onChange,
  placeholder = "Paste URL or email address...",
  onEmailDetected,
}: EmailPasteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const extractEmail = useCallback((text: string) => {
    const matches = text.match(EMAIL_REGEX);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return null;
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      try {
        const clipboardText = e.clipboardData.getData("text");
        onChange(clipboardText);

        // Check if it's an email
        const email = extractEmail(clipboardText);
        if (email && onEmailDetected) {
          onEmailDetected(email);
        }
      } catch (error) {
        console.error("Failed to read clipboard:", error);
      }
    },
    [onChange, extractEmail, onEmailDetected]
  );

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        onChange(clipboardText);

        // Check if it's an email
        const email = extractEmail(clipboardText);
        if (email && onEmailDetected) {
          onEmailDetected(email);
        }
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  }, [onChange, extractEmail, onEmailDetected]);

  const emailInValue = extractEmail(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePasteFromClipboard}
          title="Paste from clipboard"
        >
          <Clipboard className="size-4" />
        </Button>
      </div>
      {emailInValue && (
        <p className="text-xs text-muted-foreground">
          Email found: <span className="font-mono text-foreground">{emailInValue}</span>
        </p>
      )}
    </div>
  );
}
