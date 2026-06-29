'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Candidate, Election } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export default function VotePage() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.type !== 'student') {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    console.log('🗳️ Vote page loaded, user:', user);
    setLoading(true);
    const [candidatesRes, electionsRes] = await Promise.all([
      supabase.from('candidates').select('*'),
      supabase.from('elections').select('*')
    ]);
    if (candidatesRes.data) setCandidates(candidatesRes.data);
    if (electionsRes.data) {
      setElections(electionsRes.data);
      const active = electionsRes.data.find(e => e.is_active);
      setActiveElection(active || null);
      console.log('🗳️ Active election:', active);
      if (active && user) {
        checkVotes(active.id);
      }
    }
    setLoading(false);
  };

  const checkVotes = async (electionId: string) => {
    if (!user || user.type !== 'student') return;
    console.log('🗳️ Checking votes for student:', user.id, 'in election:', electionId);
    const { data, error } = await supabase.from('votes').select('*').eq('election_id', electionId).eq('student_id', user.id);
    console.log('🗳️ Check votes response:', { data, error });
    
    if (data && data.length > 0) {
      // If student has already voted, redirect to thank you page
      console.log('🗳️ Student already voted, redirecting to thanks');
      router.push('/vote/thanks');
    }
  };

  const handleVote = (position: string, candidateId: string) => {
    setVotes(prev => ({ ...prev, [position]: candidateId }));
  };

  const submitVotes = async () => {
    console.log('🗳️ submitVotes called!');
    if (!user || user.type !== 'student' || !activeElection) {
      console.log('🗳️ Missing required data for submission:', { user, activeElection });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    try {
      const votesToInsert = Object.entries(votes).map(([position, candidateId]) => ({
        election_id: activeElection.id,
        student_id: user.id,
        candidate_id: candidateId,
        position: position
      }));
      
      console.log('🗳️ Votes to insert:', votesToInsert);
      
      const { data, error } = await supabase.from('votes').insert(votesToInsert).select();
      
      console.log('🗳️ Insert response:', { data, error });
      
      if (error) {
        console.error('🗳️ Error inserting votes:', error);
        throw error;
      }
      
      console.log('🗳️ All votes submitted successfully! Redirecting to thanks page.');
      router.push('/vote/thanks');
    } catch (err: any) {
      console.error('🗳️ Vote submission error:', err);
      setMessage({ text: 'Error submitting votes: ' + (err?.message || 'Unknown error'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const positions = [...new Set(
    candidates.filter(c => !activeElection || c.election_id === activeElection.id || !c.election_id).map(c => c.position)
  )];
  const currentPosition = positions[currentPositionIndex];
  const currentCandidates = candidates.filter(c => 
    c.position === currentPosition && 
    (!activeElection || c.election_id === activeElection.id || !c.election_id)
  );
  const progress = (Object.keys(votes).length / positions.length) * 100;

  const nextPosition = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1);
    }
  };

  const prevPosition = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1);
    }
  };

  const isLastPosition = currentPositionIndex === positions.length - 1;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🗳️</div>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (!activeElection) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Active Election</h1>
        <p className="text-gray-600 mb-6">There is currently no active election. Please check back later.</p>
        <div className="space-y-3">
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cast Your Vote</h1>
            {user && user.type === 'student' && (
              <p className="text-gray-600 mt-1">Welcome, {user.first_name}!</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Election: {activeElection.name}</p>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Object.keys(votes).length} of {positions.length} positions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold">{currentPosition}</h2>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                Position {currentPositionIndex + 1} of {positions.length}
              </span>
            </div>
            {votes[currentPosition] && (
              <p className="text-white/90 mt-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                You can change your vote before submitting all votes at the end!
              </p>
            )}
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {currentCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  onClick={() => handleVote(currentPosition, candidate.id)}
                  className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    votes[currentPosition] === candidate.id 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {candidate.photo_url ? (
                        <img
                          src={candidate.photo_url}
                          alt={candidate.name}
                          className="w-28 h-28 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className={`w-28 h-28 rounded-lg flex items-center justify-center text-4xl font-bold ${
                          votes[currentPosition] === candidate.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                        {candidate.manifesto && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.manifesto}</p>
                        )}
                      </div>
                    </div>
                    {votes[currentPosition] === candidate.id && (
                      <div className="text-green-500 text-2xl flex-shrink-0">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              {currentPositionIndex > 0 && (
                <button
                  onClick={prevPosition}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Previous
                </button>
              )}
              
              {isLastPosition ? (
                <button
                  onClick={submitVotes}
                  disabled={submitting || Object.keys(votes).length === 0}
                  className={`flex-1 py-3 font-semibold rounded-lg transition-colors ${
                    submitting || Object.keys(votes).length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Votes!'}
                </button>
              ) : (
                <button
                  onClick={nextPosition}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-700 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
