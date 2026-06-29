'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate, Election } from '@/lib/types';
import Link from 'next/link';
import ProtectedAdminRoute from '../../contexts/ProtectedRoute';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    manifesto: '',
    photo_url: '',
    election_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [candidatesRes, electionsRes] = await Promise.all([
      supabase.from('candidates').select('*').order('created_at', { ascending: false }),
      supabase.from('elections').select('*').order('created_at', { ascending: false })
    ]);
    
    if (candidatesRes.error) {
      console.error('Error loading candidates:', candidatesRes.error);
      setMessage({ text: `Failed to load candidates: ${candidatesRes.error.message}`, type: 'error' });
    }
    if (electionsRes.error) {
      console.error('Error loading elections:', electionsRes.error);
    }
    
    if (candidatesRes.data) setCandidates(candidatesRes.data);
    if (electionsRes.data) setElections(electionsRes.data);
    setLoading(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToInsert = {
        ...formData,
        election_id: formData.election_id || null
      };
      const { error } = await supabase.from('candidates').insert([dataToInsert]).select();
      if (error) {
        console.error('Error adding candidate:', error);
        setMessage({ text: `Failed to add candidate: ${error.message}`, type: 'error' });
        return;
      }
      setShowAddForm(false);
      setFormData({ name: '', position: '', manifesto: '', photo_url: '', election_id: '' });
      setMessage({ text: 'Candidate added successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: `Failed to add candidate: ${err}`, type: 'error' });
    }
  };

  const handleEditClick = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      position: candidate.position,
      manifesto: candidate.manifesto || '',
      photo_url: candidate.photo_url || '',
      election_id: candidate.election_id || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      const dataToUpdate = {
        ...formData,
        election_id: formData.election_id || null
      };
      const { error } = await supabase.from('candidates').update(dataToUpdate).eq('id', editingCandidate.id);
      if (error) {
        console.error('Error updating candidate:', error);
        setMessage({ text: `Failed to update candidate: ${error.message}`, type: 'error' });
        return;
      }
      setEditingCandidate(null);
      setFormData({ name: '', position: '', manifesto: '', photo_url: '', election_id: '' });
      setMessage({ text: 'Candidate updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: `Failed to update candidate: ${err}`, type: 'error' });
    }
  };

  const handleDelete = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      // First delete all votes for this candidate
      const { error: votesError } = await supabase.from('votes').delete().eq('candidate_id', candidateId);
      if (votesError) {
        console.error('Error deleting votes:', votesError);
      }
      
      // Then delete the candidate
      const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
      if (error) {
        console.error('Error deleting candidate:', error);
        setMessage({ text: `Failed to delete candidate: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'Candidate deleted successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: `Failed to delete candidate: ${err}`, type: 'error' });
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Candidates</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add Candidate'}
            </button>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {showAddForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Add New Candidate</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Election</label>
                  <select
                    value={formData.election_id}
                    onChange={(e) => setFormData({ ...formData, election_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Election (Optional)</option>
                    {elections.map(election => (
                      <option key={election.id} value={election.id}>
                        {election.name} {election.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
                  <textarea
                    value={formData.manifesto}
                    onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                  <input
                    type="text"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Candidate
                </button>
              </form>
            </div>
          )}

          {editingCandidate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Candidate</h2>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Election</label>
                    <select
                      value={formData.election_id}
                      onChange={(e) => setFormData({ ...formData, election_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Election (Optional)</option>
                      {elections.map(election => (
                        <option key={election.id} value={election.id}>
                          {election.name} {election.is_active ? '(Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
                    <textarea
                      value={formData.manifesto}
                      onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                    <input
                      type="text"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Candidate
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCandidate(null)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map(candidate => (
              <div key={candidate.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
                {candidate.photo_url && (
                  <div className="mb-4">
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{candidate.name}</h3>
                  <p className="text-blue-600 font-medium mt-1">{candidate.position}</p>
                  {candidate.manifesto && <p className="text-sm text-gray-600 mt-2">{candidate.manifesto}</p>}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(candidate)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(candidate.id)}
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
