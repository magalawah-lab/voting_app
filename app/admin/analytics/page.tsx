'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/supabase-helpers';
import { Candidate, Vote, Student, Class, Election } from '@/lib/types';
import ProtectedAdminRoute from '../../contexts/ProtectedRoute';

type Turnout = { total: number; voted: number; percentage: number };

export default function AdminAnalyticsPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [searchStudentId, setSearchStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filteredVotes = useMemo(
    () =>
      selectedElectionId
        ? votes.filter(v => v.election_id === selectedElectionId)
        : votes,
    [votes, selectedElectionId]
  );

  const filteredCandidates = useMemo(
    () =>
      selectedElectionId
        ? candidates.filter(c => c.election_id === selectedElectionId || !c.election_id)
        : candidates,
    [candidates, selectedElectionId]
  );

  const turnout = useMemo<Turnout>(() => {
    const voterIds = new Set(filteredVotes.map(v => v.student_id));
    const totalStudents = students.length;
    const voted = voterIds.size;
    const percentage = totalStudents > 0 ? (voted / totalStudents) * 100 : 0;
    return { total: totalStudents, voted, percentage };
  }, [filteredVotes, students]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logSupabaseError = (label: string, err: Error) => {
    console.error(`Failed to load ${label}:`, err);
    setLoadError(`Failed to load ${label}: ${err.message}`);
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [electionsRes, candidatesRes, studentsResult, classesRes, votesResult] =
        await Promise.all([
          supabase.from('elections').select('*').order('created_at', { ascending: false }),
          supabase.from('candidates').select('*'),
          fetchAllRows<Student>('students', '*, classes(name)'),
          supabase.from('classes').select('*'),
          fetchAllRows<Vote>('votes', '*', {
            orderBy: { column: 'voted_at', ascending: false },
          }),
        ]);

      if (electionsRes.error) {
        return logSupabaseError('elections', new Error(electionsRes.error.message));
      }
      if (candidatesRes.error) {
        return logSupabaseError('candidates', new Error(candidatesRes.error.message));
      }
      if (studentsResult.error) {
        return logSupabaseError('students', studentsResult.error);
      }
      if (classesRes.error) {
        return logSupabaseError('classes', new Error(classesRes.error.message));
      }
      if (votesResult.error) {
        return logSupabaseError('votes', votesResult.error);
      }

      const electionsData = electionsRes.data ?? [];
      const candidatesData = candidatesRes.data ?? [];
      const studentsData = studentsResult.data;
      const classesData = classesRes.data ?? [];
      const votesData = votesResult.data;

      setElections(electionsData);
      setCandidates(candidatesData);
      setStudents(studentsData);
      setClasses(classesData);
      setVotes(votesData);

      const activeElection = electionsData.find(e => e.is_active);
      if (!selectedElectionId && activeElection?.id) {
        setSelectedElectionId(activeElection.id);
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setLoadError('Failed to load analytics data. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const exportRawVotesCSV = () => {
    const header = ['Student ID', 'Student Name', 'Candidate Name', 'Position', 'Election ID', 'Voted At'];
    const rows = filteredVotes.map(vote => {
      const student = students.find(s => s.id === vote.student_id);
      const candidate = candidates.find(c => c.id === vote.candidate_id);
      return [
        student?.student_id || 'Unknown',
        student ? `${student.first_name} ${student.last_name}` : 'Unknown',
        candidate?.name || 'Unknown',
        vote.position,
        vote.election_id,
        vote.voted_at,
      ];
    });

    const csvContent = [header, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `raw_votes_${selectedElectionId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportResultsCSV = () => {
    const header = ['Position', 'Candidate Name', 'Votes', 'Percentage'];
    const rows: string[][] = [];

    getResultsByPosition().forEach(result => {
      const totalVotes = result.candidates.reduce((sum, c) => sum + c.votes, 0);
      result.candidates.forEach(candidate => {
        const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(2) + '%' : '0%';
        rows.push([result.position, candidate.name, String(candidate.votes), percentage]);
      });
      rows.push(['', '', '', '']);
    });

    const csvContent = [header, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `election_results_${selectedElectionId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getResultsByPosition = () => {
    const positions = [...new Set(filteredCandidates.map(c => c.position))];
    return positions.map(position => {
      const positionCandidates = filteredCandidates.filter(c => c.position === position);
      return {
        position,
        candidates: positionCandidates
          .map(candidate => {
            const voteCount = filteredVotes.filter(v => v.candidate_id === candidate.id).length;
            return { ...candidate, votes: voteCount };
          })
          .sort((a, b) => b.votes - a.votes),
      };
    });
  };

  const getVoterTurnoutByClass = () => {
    return classes.map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id);
      const votedStudentIds = new Set(
        filteredVotes
          .filter(v => classStudents.some(s => s.id === v.student_id))
          .map(v => v.student_id)
      );
      return {
        class: cls.name,
        total: classStudents.length,
        voted: votedStudentIds.size,
        percentage: classStudents.length > 0 ? (votedStudentIds.size / classStudents.length) * 100 : 0,
      };
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const results = getResultsByPosition();
  const classTurnout = getVoterTurnoutByClass();
  const selectedElection = elections.find(e => e.id === selectedElectionId);

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Admin Panel
            </Link>
          </div>

          {loadError && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{loadError}</div>
          )}

          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Election Analytics</h1>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={exportRawVotesCSV}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Raw Votes (CSV)
              </button>
              <button
                onClick={exportResultsCSV}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Export Results (CSV)
              </button>

              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Election</label>
                <select
                  value={selectedElectionId}
                  onChange={e => setSelectedElectionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Elections</option>
                  {elections.map(election => (
                    <option key={election.id} value={election.id}>
                      {election.name} {election.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Student</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Student ID (e.g., S4016)"
                value={searchStudentId}
                onChange={e => setSearchStudentId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setSearchStudentId('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>

            {searchStudentId && (
              <div className="mt-6">
                {(() => {
                  const student = students.find(s =>
                    s.student_id.toLowerCase().includes(searchStudentId.toLowerCase())
                  );

                  if (!student) {
                    return <p className="text-red-600">No student found with ID: {searchStudentId}</p>;
                  }

                  const studentVotes = votes.filter(v => v.student_id === student.id);
                  const studentVotesInSelectedElection = selectedElectionId
                    ? studentVotes.filter(v => v.election_id === selectedElectionId)
                    : studentVotes;

                  return (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {student.first_name} {student.last_name} ({student.student_id})
                      </h3>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Votes for this student:</h4>
                        {studentVotes.length === 0 ? (
                          <p className="text-gray-500">No votes found for this student</p>
                        ) : (
                          <ul className="space-y-2 text-sm text-gray-700">
                            {studentVotesInSelectedElection.map(vote => {
                              const candidate = candidates.find(c => c.id === vote.candidate_id);
                              return (
                                <li key={vote.id}>
                                  {vote.position}: {candidate?.name ?? 'Unknown candidate'}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {selectedElection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-800">{selectedElection.name}</h3>
              {selectedElection.description && (
                <p className="text-blue-700 text-sm mt-1">{selectedElection.description}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 mb-4 text-sm text-gray-600">
            Loaded {votes.length} vote record{votes.length === 1 ? '' : 's'} and {students.length} student
            {students.length === 1 ? '' : 's'} from Supabase.
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Overall Voter Turnout</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{turnout.total}</div>
                <div className="text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{turnout.voted}</div>
                <div className="text-gray-600">Voted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{turnout.percentage.toFixed(1)}%</div>
                <div className="text-gray-600">Turnout</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Voter Breakdown</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">All Students (Total: {students.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {students.map(student => {
                  const hasVotedAnyElection = votes.some(v => v.student_id === student.id);
                  const hasVotedSelectedElection = selectedElectionId
                    ? votes.some(v => v.student_id === student.id && v.election_id === selectedElectionId)
                    : false;

                  return (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg border ${
                        hasVotedSelectedElection
                          ? 'bg-green-50 border-green-200'
                          : hasVotedAnyElection
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-xs text-gray-600">{student.student_id}</div>
                      <div className="text-xs mt-1">
                        {hasVotedSelectedElection ? (
                          <span className="text-green-700 font-medium">Voted (Selected Election)</span>
                        ) : hasVotedAnyElection ? (
                          <span className="text-yellow-700 font-medium">Voted (Other Election)</span>
                        ) : (
                          <span className="text-gray-500">Not Voted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Voter Turnout by Class</h2>
            <div className="space-y-4">
              {classTurnout.map(ct => (
                <div key={ct.class} className="flex items-center justify-between">
                  <span className="font-medium">{ct.class}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${ct.percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-600">
                      {ct.voted}/{ct.total} ({ct.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {results.map(result => (
              <div key={result.position} className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{result.position}</h2>
                <div className="space-y-4">
                  {result.candidates.map(candidate => {
                    const maxVotes = result.candidates[0]?.votes ?? 0;
                    return (
                      <div key={candidate.id} className="flex items-center justify-between">
                        <span className="font-medium">{candidate.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-green-500 h-4 rounded-full"
                              style={{
                                width: maxVotes > 0 ? `${(candidate.votes / maxVotes) * 100}%` : '0%',
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{candidate.votes} votes</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
