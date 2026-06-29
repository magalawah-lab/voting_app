'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Student, Class } from '@/lib/types';
import Link from 'next/link';
import ProtectedAdminRoute from '../../contexts/ProtectedRoute';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    class_id: '',
    password: ''
  });
  const [batchClassId, setBatchClassId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      supabase.from('students').select('*, classes(name)'),
      supabase.from('classes').select('*')
    ]);
    if (studentsRes.error) {
      console.error('Error loading students:', studentsRes.error);
      setMessage({ text: `Failed to load students: ${studentsRes.error.message}`, type: 'error' });
    }
    if (classesRes.error) {
      console.error('Error loading classes:', classesRes.error);
    }
    if (studentsRes.data) setStudents(studentsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setLoading(false);
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const passwordToUse = formData.password || generatePassword();
      const { data, error } = await supabase.from('students').insert([
        { ...formData, password: passwordToUse }
      ]).select();
      if (error) {
        console.error('Error adding student:', error);
        setMessage({ text: `Failed to add student: ${error.message}`, type: 'error' });
        return;
      }
      setShowForm(false);
      setFormData({ student_id: '', first_name: '', last_name: '', class_id: '', password: '' });
      setMessage({ 
        text: `Student added successfully! Temporary password: ${passwordToUse}`, 
        type: 'success' 
      });
      setTimeout(() => setMessage(null), 8000);
      loadData();
    } catch (err) {
      setMessage({ text: 'Failed to add student', type: 'error' });
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      // First delete all votes for this student
      const { error: votesError } = await supabase.from('votes').delete().eq('student_id', studentId);
      if (votesError) {
        console.error('Error deleting votes:', votesError);
      }
      
      // Then delete the student
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) {
        setMessage({ text: `Failed to delete student: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: 'Student deleted successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: 'Failed to delete student', type: 'error' });
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) return;
    
    try {
      // First delete all votes for these students
      const { error: votesError } = await supabase.from('votes').delete().in('student_id', selectedStudents);
      if (votesError) {
        console.error('Error deleting votes:', votesError);
      }
      
      // Then delete the students
      const { error } = await supabase.from('students').delete().in('id', selectedStudents);
      if (error) {
        setMessage({ text: `Failed to delete students: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: `${selectedStudents.length} students deleted successfully!`, type: 'success' });
      setSelectedStudents([]);
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: 'Failed to delete students', type: 'error' });
    }
  };

  const handleBatchEdit = async () => {
    if (!batchClassId) {
      setMessage({ text: 'Please select a class for batch edit', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase.from('students').update({ class_id: batchClassId }).in('id', selectedStudents);
      if (error) {
        setMessage({ text: `Failed to update students: ${error.message}`, type: 'error' });
        return;
      }
      setMessage({ text: `${selectedStudents.length} students updated successfully!`, type: 'success' });
      setSelectedStudents([]);
      setShowBatchEdit(false);
      setTimeout(() => setMessage(null), 5000);
      loadData();
    } catch (err) {
      setMessage({ text: 'Failed to update students', type: 'error' });
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const downloadTemplate = () => {
    const templateContent = 'student_id,first_name,last_name,class_name,password\nS0001,John,Doe,10A,password123\nS0002,Jane,Smith,10B,password123';
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        const studentsToInsert = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 4) {
            const className = values[3];
            const cls = classes.find(c => c.name === className);
            const password = values[4] || generatePassword();
            studentsToInsert.push({
              student_id: values[0],
              first_name: values[1],
              last_name: values[2],
              class_id: cls?.id || null,
              password
            });
          }
        }

        if (studentsToInsert.length > 0) {
          const { error } = await supabase.from('students').insert(studentsToInsert);
          if (error) {
            setMessage({ text: `Failed to import students: ${error.message}`, type: 'error' });
          } else {
            setMessage({ text: `Successfully imported ${studentsToInsert.length} students!`, type: 'success' });
            setTimeout(() => setMessage(null), 5000);
            loadData();
          }
        }
      } catch (err) {
        setMessage({ text: 'Failed to import students', type: 'error' });
      }
    };
    reader.readAsText(file);
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

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowImport(!showImport)}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
              >
                {showImport ? 'Cancel Import' : 'Import Students'}
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : 'Add Student'}
              </button>
            </div>
          </div>

          {selectedStudents.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
              <span className="text-yellow-800 font-medium">
                {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchEdit(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Batch Edit Class
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                >
                  Batch Delete
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {showImport && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Import Students from CSV</h2>
              <div className="space-y-4">
                <p className="text-gray-600">Upload a CSV file with student data. Download the template below for the correct format. Password field is optional - will be auto-generated if left blank.</p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Download Sample Template
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional - auto-generate if left blank)</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          )}

          {showBatchEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4">Batch Edit Students</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select New Class</label>
                    <select
                      value={batchClassId}
                      onChange={(e) => setBatchClassId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBatchEdit}
                      className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                      Update Class
                    </button>
                    <button
                      onClick={() => setShowBatchEdit(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudents.length === students.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id} className={selectedStudents.includes(student.id) ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.first_name} {student.last_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{(student as any).classes?.name || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
