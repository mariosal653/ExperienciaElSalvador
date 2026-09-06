'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: '/' })}
      className="flex items-center gap-2 rounded-full border border-white/50 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-[#173f45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4b942]"
    >
      <LogOut size={15} />
      Cerrar sesión
    </button>
  )
}
