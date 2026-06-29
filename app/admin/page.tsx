'use client';

import Link from 'next/link';
import ProtectedAdminRoute from '../contexts/ProtectedRoute';

export default function AdminPage() {
  const adminLinks = [
    { href: '/admin/elections', label: 'Manage Elections', icon: '🗳️' },
    { href: '/admin/classes', label: 'Manage Classes', icon: '📚' },
    { href: '/admin/students', label: 'Manage Students', icon: '👥' },
    { href: '/admin/candidates', label: 'Manage Candidates', icon: '🏆' },
    { href: '/admin/analytics', label: 'View Analytics', icon: '📊' },
  ];

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Panel</h1>
            <p className="text-xl text-gray-700">Manage your election process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl mb-4">{link.icon}</div>
                <h2 className="text-xl font-semibold text-gray-900">{link.label}</h2>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
