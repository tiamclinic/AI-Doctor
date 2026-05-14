"use client";

import { Check, Link2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyLinkButtonProps = {
  url: string;
  className?: string;
};

export function CopyLinkButton({ url, className }: CopyLinkButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("以下の URL をコピーしてください", url);
    }
  }, [url]);

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("gap-2", className)}
      disabled={!url}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          コピーしました
        </>
      ) : (
        <>
          <Link2 className="size-4" />
          リンクをコピー
        </>
      )}
    </Button>
  );
}
