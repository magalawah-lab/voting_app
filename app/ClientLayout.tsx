'use client';

import Link from "next/link";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function NavbarContent() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold hover:text-blue-100 transition-colors">
            🗳️ Voting Portal
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/" className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Home
            </Link>
            {user ? (
              <>
                {user.type === 'student' && (
                  <Link href="/vote" className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Vote
                  </Link>
                )}
                {user.type === 'admin' && (
                  <Link href="/admin" className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Student Login
                </Link>
                <Link href="/admin/login" className="px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Admin Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarContent />
      <main className="flex-1">{children}</main>
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </AuthProvider>
  );
}
