'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Class } from '@/lib/types';
import Link from 'next/link';
import ProtectedAdminRoute from '../../contexts/ProtectedRoute';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [className, setClassName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
      console.error('Error loading classes:', error);
      setMessage({ text: `Failed to load classes: ${error.message}`, type: 'error' });
    }
    if (data) setClasses(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('classes').insert([{ name: className }]).select();
      if (error) {
        console.error('Error adding class:', error);
        setMessage({ text: `Failed to add class: ${error.message}`, type: 'error' });
        return;
      }
      setShowForm(false);
      setClassName('');
      setMessage({ text: 'Class added successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadClasses();
    } catch (err) {
      setMessage({ text: `Failed to add class: ${err}`, type: 'error' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Admin Panel
            </Link>
          </div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Classes</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Add Class'}
            </button>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Add New Class</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  placeholder="Enter class name (e.g., 10A, 11B)"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  Add Class
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-500 mt-2">Created {new Date(cls.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
