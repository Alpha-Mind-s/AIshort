import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "pt", "ja", "ko"],
  defaultLocale: "en",
  localePrefix: "always",
});
