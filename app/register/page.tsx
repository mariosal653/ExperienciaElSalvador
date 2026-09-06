import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { auth, enabledSocialProviders } from '@/lib/auth'

export const metadata = { title: 'Create account' }

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/cuenta')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eaf1ed] px-5 py-14">
      <Suspense>
        <AuthForm mode="register" socialProviders={enabledSocialProviders()} />
      </Suspense>
    </main>
  )
}
