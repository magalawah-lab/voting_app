'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Election } from '@/lib/types';
import Link from 'next/link';
import ProtectedAdminRoute from '../../contexts/ProtectedRoute';

export default function AdminElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('elections').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading elections:', error);
      setMessage({ text: `Failed to load elections: ${error.message}`, type: 'error' });
    }
    if (data) setElections(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingElection) {
        const { error } = await supabase.from('elections').update(formData).eq('id', editingElection.id);
        if (error) {
          setMessage({ text: `Failed to update election: ${error.message}`, type: 'error' });
          return;
        }
        setMessage({ text: 'Election updated successfully!', type: 'success' });
      } else {
        const { error } = await supabase.from('elections').insert([formData]).select();
        if (error) {
          setMessage({ text: `Failed to create election: ${error.message}`, type: 'error' });
          return;
        }
        setMessage({ text: 'Election created successfully!', type: 'success' });
      }
      setShowForm(false);
      setEditingElection(null);
      setFormData({ name: '', description: '' });
      setTimeout(() => setMessage(null), 5000);
      loadElections();
    } catch (err) {
      setMessage({ text: `Failed to save election: ${err}`, type: 'error' });
    }
  };

  const handleEditClick = (election: Election) => {
    setEditingElection(election);
    setFormData({
      name: election.name,
      description: election.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (electionId: string) => {
    if (!confirm('Are you sure you want to delete this election? This will also delete all associated candidates and votes.')) return;

    try {
      const { error } = await supabase.from('elections').delete().eq('id', electionId);
      if (error) {
        setMessage({ text: `Failed to delete election: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'Election deleted successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadElections();
    } catch (err) {
      setMessage({ text: `Failed to delete election: ${err}`, type: 'error' });
    }
  };

  const handleSetActive = async (election: Election) => {
    try {
      // First, deactivate all elections
      await supabase.from('elections').update({ is_active: false });
      // Then activate this one
      const { error } = await supabase.from('elections').update({ is_active: true }).eq('id', election.id);
      if (error) {
        setMessage({ text: `Failed to activate election: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'Election activated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadElections();
    } catch (err) {
      setMessage({ text: `Failed to activate election: ${err}`, type: 'error' });
    }
  };

  const handleResetVotes = async (election: Election) => {
    if (!confirm(`Are you sure you want to reset all votes for "${election.name}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase.from('votes').delete().eq('election_id', election.id);
      if (error) {
        setMessage({ text: `Failed to reset votes: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'All votes reset successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ text: `Failed to reset votes: ${err}`, type: 'error' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Admin Panel
            </Link>
          </div>
          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Manage Elections</h1>
            <button
              onClick={() => {
                setEditingElection(null);
                setFormData({ name: '', description: '' });
                setShowForm(!showForm);
              }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancel' : 'Create Election'}
            </button>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingElection ? 'Edit Election' : 'Create New Election'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Election Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingElection ? 'Update Election' : 'Create Election'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingElection(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map(election => (
              <div key={election.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{election.name}</h3>
                    {election.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {election.description && <p className="text-sm text-gray-600 mb-3">{election.description}</p>}
                  <p className="text-xs text-gray-400">Created {new Date(election.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  {!election.is_active && (
                    <button
                      onClick={() => handleSetActive(election)}
                      className="w-full px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Set as Active
                    </button>
                  )}
                  <button
                    onClick={() => handleResetVotes(election)}
                    className="w-full px-3 py-2 bg-yellow-50 text-yellow-700 font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    Reset Votes
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(election)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(election.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
