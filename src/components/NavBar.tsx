"use client"

import { useSession, signOut, signIn } from "next-auth/react"
import Link from "next/link"

export default function NavBar() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-lg">Voting Game</Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-black">Home</Link>
            <Link href="/rooms" className="hover:text-black">Rooms</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
