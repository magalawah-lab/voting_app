'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function VoteThanksPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.type !== 'student') {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-8 text-center">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Thank You for Voting!</h1>
        </div>
        <div className="p-8 text-center">
          {user && user.type === 'student' && (
            <p className="text-gray-700 mb-6">
              We appreciate your participation, {user.first_name}! Your voice has been heard in this election.
            </p>
          )}
          <div className="space-y-4">
            <Link 
              href="/"
              className="block w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Go to Home
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
