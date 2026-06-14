import { Link } from "@/lib/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand visual (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/20">
        {/* Abstract cinematic backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_oklch(62%_0.22_280_/_15%),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,_oklch(62%_0.22_280_/_8%),_transparent_50%)]" />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="AIshort" className="h-10 w-auto" />
            <span className="font-bold text-2xl text-white tracking-tight">AIshort</span>
          </Link>

          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Stories without borders.
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              AI-localized short dramas from around the world, in your language.
            </p>
          </div>

          {/* Subtle testimonial / trust line */}
          <p className="text-xs text-white/40">
            © 2026 AIshort. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        {/* Mobile logo (hidden on desktop where left panel shows it) */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 font-bold text-2xl text-primary mb-8 hover:opacity-80 transition-opacity"
        >
          <img src="/logo.png" alt="AIshort" className="h-10 w-auto" />
          <span>AIshort</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
