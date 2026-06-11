"use client";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { LOCALES } from "@/lib/utils/constants";

const FLAGS: Record<string, string> = {
  en: "US",
  es: "ES",
  pt: "BR",
  ja: "JP",
  ko: "KR",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <select
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
      defaultValue=""
    >
      <option value="" disabled>
        Language
      </option>
      {LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {FLAGS[loc]} {loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
