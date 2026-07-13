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
  const [editingClass, setEditingClass] = useState<Class | null>(null);
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

  const handleEditClick = (cls: Class) => {
    setEditingClass(cls);
    setClassName(cls.name);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      const { error } = await supabase.from('classes').update({ name: className }).eq('id', editingClass.id);
      if (error) {
        console.error('Error updating class:', error);
        setMessage({ text: `Failed to update class: ${error.message}`, type: 'error' });
        return;
      }
      setEditingClass(null);
      setClassName('');
      setMessage({ text: 'Class updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadClasses();
    } catch (err) {
      setMessage({ text: `Failed to update class: ${err}`, type: 'error' });
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will remove the class from any students assigned to it.')) return;

    try {
      // First, update any students assigned to this class to have null class_id
      const { error: updateError } = await supabase.from('students').update({ class_id: null }).eq('class_id', classId);
      if (updateError) {
        console.error('Error updating students:', updateError);
      }

      // Then delete the class
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) {
        console.error('Error deleting class:', error);
        setMessage({ text: `Failed to delete class: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'Class deleted successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadClasses();
    } catch (err) {
      setMessage({ text: `Failed to delete class: ${err}`, type: 'error' });
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
              onClick={() => {
                setShowForm(!showForm);
                setEditingClass(null);
                setClassName('');
              }}
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

          {(showForm || editingClass) && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
              <form onSubmit={editingClass ? handleEditSubmit : handleSubmit}>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  placeholder="Enter class name (e.g., 10A, 11B)"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    {editingClass ? 'Update Class' : 'Add Class'}
                  </button>
                  {editingClass && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClass(null);
                        setClassName('');
                        setShowForm(false);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-2">Created {new Date(cls.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(cls)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
