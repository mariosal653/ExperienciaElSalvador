'use client'

import { SessionProvider } from 'next-auth/react'

/** SessionProvider es cliente; el layout es servidor. Este puente los une. */
export function SessionBoundary({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
