import { Link } from "@/lib/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary mb-8 hover:opacity-80 transition-opacity">
        <span>🎬</span>
        <span>AIshort</span>
      </Link>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
