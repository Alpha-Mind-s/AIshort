"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  /** Fallback href when browser history is empty (direct link visit). */
  fallbackHref: string;
  /** Optional label, hidden on small screens. */
  label?: string;
  /** Additional class names. */
  className?: string;
}

/**
 * Back button with browser-history-aware behaviour:
 * - Uses router.back() when the user arrived via in-app navigation.
 * - Falls back to fallbackHref for direct visits (bookmark / shared link).
 */
export function BackButton({ fallbackHref, label, className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // window.history.length counts entries for the current tab.
    // A value of 1 means this is the first page the tab ever loaded.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
