"use client";

import { useEffect } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK === "true") {
      const init = async () => {
        const { worker } = await import("@/lib/mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
      };
      init();
    }
  }, []);

  return <>{children}</>;
}
