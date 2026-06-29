'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type UserType = 'student' | 'admin' | null;

interface StudentUser {
  type: 'student';
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
}

interface AdminUser {
  type: 'admin';
  email: string;
}

type User = StudentUser | AdminUser | null;

interface AuthContextType {
  user: User;
  loginAsStudent: (studentId: string, password: string) => Promise<boolean>;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    console.log('🔐 AuthProvider initialized, checking localStorage...');
    const savedUser = localStorage.getItem('votingAppUser');
    console.log('🔐 Saved user in localStorage:', savedUser);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('🔐 Parsed user:', parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('🔐 Error parsing saved user:', err);
      }
    }
    setLoading(false);

    // Listen for Supabase auth changes (for admins)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Supabase auth state changed:', { event, session });
      if (session) {
        const adminUser: AdminUser = {
          type: 'admin',
          email: session.user.email!,
        };
        console.log('🔐 Setting admin user:', adminUser);
        setUser(adminUser);
        localStorage.setItem('votingAppUser', JSON.stringify(adminUser));
      } else {
        // Check if we have a student session, if not, log out fully
        const currentUser = JSON.parse(localStorage.getItem('votingAppUser') || 'null');
        console.log('🔐 No Supabase session, checking current user:', currentUser);
        if (!currentUser || currentUser.type === 'admin') {
          console.log('🔐 Logging out');
          setUser(null);
          localStorage.removeItem('votingAppUser');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsStudent = async (studentId: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting student login for ID:', studentId);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) {
        console.error('🔐 Student login error (Supabase):', error);
        return false;
      }
      if (!data) {
        console.error('🔐 Student login error: No student found with that ID');
        return false;
      }

      console.log('🔐 Found student in database:', data);

      // In a real app, you'd hash passwords! For demo purposes, we're using plain text (BAD!)
      if (data.password === password) {
        console.log('🔐 Password matches, creating student user...');
        const studentUser: StudentUser = {
          type: 'student',
          id: data.id,
          student_id: data.student_id,
          first_name: data.first_name,
          last_name: data.last_name,
          class_id: data.class_id,
        };
        console.log('🔐 Student user object:', studentUser);
        setUser(studentUser);
        localStorage.setItem('votingAppUser', JSON.stringify(studentUser));
        console.log('🔐 Student user saved to localStorage');
        return true;
      } else {
        console.error('🔐 Student login error: Incorrect password');
      }
      return false;
    } catch (err) {
      console.error('🔐 Student login error (catch):', err);
      return false;
    }
  };

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting admin login for email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Admin login error (Supabase):', error);
        return false;
      }
      console.log('Admin login successful:', data);
      return true;
    } catch (err) {
      console.error('Admin login error (catch):', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('votingAppUser');
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loginAsStudent, loginAsAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
