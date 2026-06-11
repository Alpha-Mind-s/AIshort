"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NEXT_PUBLIC_MOCK !== "true"
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK === "true") {
      const init = async () => {
        const { worker } = await import("@/lib/mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
        setReady(true);
      };
      init();
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
