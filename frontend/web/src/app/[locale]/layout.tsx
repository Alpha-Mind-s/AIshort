import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/lib/i18n/routing";
import { Providers } from "@/components/Providers";
import { MSWProvider } from "@/components/MSWProvider";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });

  return {
    title: {
      default: t("meta_title"),
      template: `%s | ${t("name")}`,
    },
    description: t("meta_description"),
    icons: {
      icon: "/logo.png",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MSWProvider>
        <Providers>{children}</Providers>
      </MSWProvider>
    </NextIntlClientProvider>
  );
}
