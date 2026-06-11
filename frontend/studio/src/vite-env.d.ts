/// <reference types="vite/client" />

declare module '@web/lib/mocks/browser' {
  export const worker: {
    start: (opts?: { onUnhandledRequest?: 'bypass' | 'warn' | 'error' }) => Promise<void>
    stop: () => void
  }
}
