import { useRef } from "react";
import { Globe } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EmailPasteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEmailDetected?: (email: string) => void;
}

export function EmailPasteInput({
  value,
  onChange,
  placeholder = "Paste website URL or social media link...",
}: EmailPasteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}
